// server.js
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');
const { Pool } = require('pg'); // PostgreSQL kütüphanesini import et

// --- Sunucu Ayarları ---
const HTTP_PORT = process.env.PORT || 8080;

// --- PostgreSQL Veritabanı Bağlantısı ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Render'da bu isimde bir ortam değişkeni olmalı
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.connect()
    .then(() => console.log('PostgreSQL veritabanına başarıyla bağlandı!'))
    .catch(err => {
        console.error('!!! VERİTABANI BAĞLANTI HATASI !!!:', err.stack);
    });

// --- Express Uygulaması ve HTTP Sunucusu ---
const app = express();
const httpServer = http.createServer(app);

// --- Statik Dosya Sunumu ('public' klasörü) ---
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'adisyon.html');
    console.log(`Serving file: ${filePath}`);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("HTML dosyası gönderilirken hata:", err);
            if (!res.headersSent) {
                 res.status(err.status || 500).send("Adisyon dosyası yüklenemedi.");
            }
        }
    });
});

app.get('/menu', (req, res) => {
    const menuFilePath = path.join(__dirname, 'public', 'menu.html');
    console.log(`Serving menu file: ${menuFilePath}`);
    res.sendFile(menuFilePath, (err) => {
        if (err) {
            console.error("Menü dosyası gönderilirken hata:", err);
             if (!res.headersSent) {
                 res.status(err.status || 500).send("Menü dosyası yüklenemedi.");
            }
        }
    });
});

// --- WebSocket Sunucusunu HTTP Sunucusuna Bağlama ---
const wss = new WebSocket.Server({ server: httpServer });

console.log(`EMET LEZZET GÜNLERİ HTTP Sunucusu ${HTTP_PORT} portunda başlatıldı.`);
console.log(`WebSocket sunucusu da bu HTTP sunucusu üzerinden çalışıyor.`);

// --- Sunucu Verileri (Bellekte Kalacak, Kalıcı Olmayacak Diğer Veriler) ---
// Bu kullanıcı ve masa verileri idealde veritabanında olmalıdır.
let users = [
    { id: 1, username: 'onkasa', password: 'onkasa12', role: 'cashier' },
    { id: 2, username: 'arkakasa', password: 'arkakasa12', role: 'cashier' },
    { id: 3, username: 'omerfaruk', password: 'omer.faruk', role: 'waiter' },
    { id: 4, username: 'zeynel', password: 'zey.nel', role: 'waiter' },
    { id: 5, username: 'halil', password: 'ha.lil', role: 'waiter' },
    { id: 6, username: 'garson', password: 'gar.son', role: 'waiter' },
];

// Ürünler artık birincil olarak veritabanından çekilecek.
// Bu global 'products' dizisi, bazı eski fonksiyonlar tarafından hala referans alınabilir
// ancak yeni implementasyonlar fetchProductsFromDB kullanmalıdır.
// İdealde bu global dizi kaldırılır ve tüm ürün işlemleri DB üzerinden yapılır.
let products_in_memory_fallback = [ // Adını değiştirdim ki karışmasın
    { id: 1001, name: "İSKENDER - 120 GR", price: 275.00, category: "ET - TAVUK" },
    // ... (diğer ürünleriniz buradaydı, kısalık için kestim) ...
    { id: 5002, name: "TARHANA ÇORBA", price: 60.00, category: "ÇORBA" }
];


let tables = [];
let nextTableIdCounter = 1;

function initializeTables() { // Bu fonksiyon masalar DB'ye taşındığında DB'den okuma yapmalı
    tables = [];
    let currentId = 1;
    for (let i = 1; i <= 5; i++) {
        tables.push({ id: `masa-${currentId++}`, name: `Kamelya ${i}`, type: 'kamelya', status: "boş", order: [], total: 0, waiterId: null, waiterUsername: null });
    }
    for (let i = 1; i <= 16; i++) {
        tables.push({ id: `masa-${currentId++}`, name: `Bahçe ${i}`, type: 'bahce', status: "boş", order: [], total: 0, waiterId: null, waiterUsername: null });
    }
    nextTableIdCounter = currentId;
    console.log(`${tables.length} masa bellekte oluşturuldu (İdealde DB'den okunmalı).`);
}
initializeTables();

const clients = new Map();

// --- WebSocket Yönetimi için Yardımcı Fonksiyonlar ---
function broadcast(message) {
    const messageString = JSON.stringify(message);
    clients.forEach((userInfo, clientSocket) => {
        if (clientSocket.readyState === WebSocket.OPEN) {
            try {
                 clientSocket.send(messageString);
            } catch (error) {
                console.error(`Mesaj gönderilemedi (${userInfo ? userInfo.username : 'Bilinmeyen'}):`, error);
                 clients.delete(clientSocket);
            }
        }
    });
}

function broadcastTableUpdates() {
    broadcast({ type: 'tables_update', payload: { tables: tables } });
}

// YENİ: Ürünleri veritabanından çeken fonksiyon
async function fetchProductsFromDB() {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY category, name');
        return result.rows;
    } catch (err) {
        console.error('Veritabanından ürünler çekilirken hata:', err);
        return []; // Hata durumunda boş array dön
    }
}

// GÜNCELLENDİ: Artık ürünleri DB'den çekiyor
async function broadcastProductsUpdate() {
    const dbProducts = await fetchProductsFromDB();
    broadcast({ type: 'products_update', payload: { products: dbProducts } });
}

function broadcastWaitersList(requestingWs) {
    const waiters = users.filter(u => u.role === 'waiter').map(u => ({ id: u.id, username: u.username }));
    const messagePayload = { type: 'waiters_list', payload: { waiters: waiters } };
    if (requestingWs && requestingWs.readyState === WebSocket.OPEN) {
        requestingWs.send(JSON.stringify(messagePayload));
    } else {
        clients.forEach((userInfo, clientSocket) => {
            if (userInfo && userInfo.role === 'cashier' && clientSocket.readyState === WebSocket.OPEN) {
                try { clientSocket.send(JSON.stringify(messagePayload)); } catch(e) { console.error("Garson listesi gönderilemedi:", e); }
            }
        });
    }
}

function calculateTableTotal(order) {
    return order.reduce((sum, item) => {
        const price = parseFloat(item.priceAtOrder) || 0;
        const quantity = parseInt(item.quantity, 10) || 0;
        return sum + (price * quantity);
    }, 0);
}

// --- Ana WebSocket Olay İşleyicisi ---
wss.on('connection', (ws) => {
    console.log('Yeni bir istemci bağlandı (WebSocket).');

    ws.on('message', async (messageAsString) => {
        let message;
        try {
            message = JSON.parse(messageAsString);
            console.log('Alınan mesaj tipi:', message.type);
        } catch (e) {
            console.error('Geçersiz JSON formatı:', messageAsString);
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Geçersiz JSON formatı.' } }));
            return;
        }

        const { type, payload } = message;
        let currentUserInfo = clients.get(ws);

        switch (type) {
            case 'login':
                const user = users.find(u => u.username === payload.username && u.password === payload.password);
                if (user) {
                    for (let [client, info] of clients.entries()) {
                        if (info.id === user.id && client !== ws) { client.terminate(); clients.delete(client); }
                    }
                    clients.set(ws, { id: user.id, username: user.username, role: user.role });
                    currentUserInfo = clients.get(ws);
                    const dbProductsLogin = await fetchProductsFromDB(); // DB'den ürünleri çek
                    ws.send(JSON.stringify({ type: 'login_success', payload: { user: currentUserInfo, tables: tables, products: dbProductsLogin }}));
                    console.log(`Kullanıcı giriş yaptı: ${user.username} (Rol: ${user.role})`);
                } else {
                    ws.send(JSON.stringify({ type: 'login_fail', payload: { error: 'Kullanıcı adı veya şifre hatalı.' } }));
                }
                break;

            case 'reauthenticate':
                 if (payload && payload.user && payload.user.id) {
                     const foundUser = users.find(u => u.id === payload.user.id && u.username === payload.user.username);
                     if (foundUser) {
                         for (let [client, info] of clients.entries()) {
                             if (info.id === foundUser.id && client !== ws) { client.terminate(); clients.delete(client); }
                         }
                         clients.set(ws, payload.user); currentUserInfo = payload.user;
                         const dbProductsReauth = await fetchProductsFromDB(); // DB'den ürünleri çek
                         ws.send(JSON.stringify({ type: 'tables_update', payload: { tables: tables } }));
                         ws.send(JSON.stringify({ type: 'products_update', payload: { products: dbProductsReauth } }));
                         console.log(`Kullanıcı oturumu sürdürdü: ${currentUserInfo.username}`);
                     } else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Geçersiz oturum bilgisi.' } }));}
                 } else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Eksik oturum bilgisi.' } }));}
                break;

            case 'get_products': // Artık fetchProductsFromDB tanımlı
                try {
                    const dbProducts = await fetchProductsFromDB();
                    ws.send(JSON.stringify({ type: 'products_update', payload: { products: dbProducts } }));
                    console.log('Sunucu: get_products isteğine products_update mesaj tipiyle yanıt verildi.');
                } catch (err) {
                    console.error('Ürünler (get_products) alınırken hata:', err); // Bu log zaten fetchProductsFromDB içinde var
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Ürünler getirilemedi.' } }));
                }
                break;

            case 'get_users': // Bu case PostgreSQL'den users tablosunu okumalı, şimdilik bellekten.
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } }));
                    return;
                }
                // İdealde: const result = await pool.query('SELECT id, username, role FROM users ORDER BY id');
                // ws.send(JSON.stringify({ type: 'users_list', payload: { users: result.rows } }));
                // Şimdilik bellekten:
                ws.send(JSON.stringify({ type: 'users_list', payload: { users: users.map(u => ({id: u.id, username: u.username, role: u.role})) } }));
                break;

            case 'add_order_item':
                if (!currentUserInfo) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Giriş yapmalısınız.' } })); return; }
                const tableToAdd = tables.find(t => t.id === payload.tableId);
                const receivedProductId = parseInt(payload.productId, 10);
                if (isNaN(receivedProductId)) { ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Geçersiz ürün IDsi.' } })); return; }
                
                // Ürün detaylarını DB'den veya güncel bir kaynaktan almalıyız.
                // Şimdilik fetchProductsFromDB ile tüm listeyi alıp oradan bulalım.
                // Daha performanslı bir çözüm, ID ile tek ürün çekmek olabilir.
                const currentProductsList = await fetchProductsFromDB();
                const productToAdd = currentProductsList.find(p => p.id === receivedProductId);

                if (tableToAdd && productToAdd && typeof payload.quantity === 'number' && payload.quantity > 0) {
                    const existingItem = tableToAdd.order.find(item => item.productId === receivedProductId && item.description === (payload.description || ''));
                    if (existingItem) {
                        existingItem.quantity += payload.quantity;
                        existingItem.waiterUsername = currentUserInfo.username;
                        existingItem.timestamp = Date.now();
                    } else {
                        tableToAdd.order.push({
                            productId: receivedProductId,
                            name: productToAdd.name,
                            category: productToAdd.category,
                            quantity: payload.quantity,
                            priceAtOrder: productToAdd.price,
                            description: payload.description || '',
                            waiterUsername: currentUserInfo.username,
                            timestamp: Date.now()
                        });
                    }
                    tableToAdd.total = calculateTableTotal(tableToAdd.order);
                    tableToAdd.status = 'dolu';
                    tableToAdd.waiterId = currentUserInfo.id; tableToAdd.waiterUsername = currentUserInfo.username;
                    broadcastTableUpdates();
                } else { ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Geçersiz masa, ürün veya adet.' } })); }
                break;

            case 'add_manual_order_item':
                 if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                const tableForManual = tables.find(t => t.id === payload.tableId);
                if (tableForManual && payload.name && typeof payload.price === 'number' && payload.price >= 0 && typeof payload.quantity === 'number' && payload.quantity > 0) {
                     tableForManual.order.push({
                         name: payload.name,
                         category: payload.category || 'Diğer',
                         quantity: payload.quantity,
                         priceAtOrder: payload.price,
                         description: payload.description || '',
                         waiterUsername: currentUserInfo.username,
                         timestamp: Date.now()
                     });
                    tableForManual.total = calculateTableTotal(tableForManual.order);
                    tableForManual.status = 'dolu';
                    tableForManual.waiterId = currentUserInfo.id; tableForManual.waiterUsername = currentUserInfo.username;
                    broadcastTableUpdates();
                } else { ws.send(JSON.stringify({ type: 'manual_order_update_fail', payload: { error: 'Geçersiz manuel ürün bilgileri.' } }));}
                break;

            case 'close_table':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { /* ... */ return; }
                const tableToClose = tables.find(t => t.id === payload.tableId);
                if (tableToClose && tableToClose.order && tableToClose.order.length > 0) {
                    const closingTime = new Date();
                    const tableName = tableToClose.name;
                    const processedBy = tableToClose.waiterUsername || currentUserInfo.username;
                    const clientDB = await pool.connect();
                    try {
                        await clientDB.query('BEGIN');
                        for (const item of tableToClose.order) {
                            const totalItemPrice = (parseFloat(item.priceAtOrder) || 0) * (parseInt(item.quantity, 10) || 0);
                            await clientDB.query(
                                `INSERT INTO sales_log (item_name, item_price, quantity, total_item_price, category, description, waiter_username, table_name, sale_timestamp)
                                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                                [
                                    item.name || 'Bilinmeyen Ürün',
                                    parseFloat(item.priceAtOrder) || 0,
                                    parseInt(item.quantity, 10) || 0,
                                    totalItemPrice,
                                    item.category || 'Diğer',
                                    item.description || null,
                                    item.waiterUsername || processedBy,
                                    tableName,
                                    closingTime // Bu TIMESTAMPTZ olarak kaydedilecek
                                ]
                            );
                        }
                        await clientDB.query('COMMIT');
                        console.log(`${tableName} masasındaki satışlar sales_log'a kaydedildi.`);
                        tableToClose.order = [];
                        tableToClose.total = 0;
                        tableToClose.status = 'boş';
                        tableToClose.waiterId = null; tableToClose.waiterUsername = null;
                        broadcastTableUpdates();
                    } catch (error) { /* ... */ } finally { clientDB.release(); }
                } else { /* ... */ }
                break;

            case 'complete_quick_sale':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { /* ... */ return; }
                if (payload && payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
                    const quickSaleTimestamp = new Date();
                    const processedByQuickSale = payload.cashierUsername || currentUserInfo.username;
                    const clientQuickSaleDB = await pool.connect();
                    try {
                        await clientQuickSaleDB.query('BEGIN');
                        const currentProductsListQuickSale = await fetchProductsFromDB(); // Güncel ürün listesi
                        for (const item of payload.items) {
                            const totalItemPrice = (parseFloat(item.priceAtOrder) || 0) * (parseInt(item.quantity, 10) || 0);
                            const productDetails = currentProductsListQuickSale.find(p => p.id === item.productId);
                            const category = item.category || (productDetails ? productDetails.category : 'Hızlı Satış');
                            await clientQuickSaleDB.query(
                                `INSERT INTO sales_log (item_name, item_price, quantity, total_item_price, category, description, waiter_username, table_name, sale_timestamp)
                                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                                [
                                    item.name || (productDetails ? productDetails.name : 'Bilinmeyen Ürün'),
                                    parseFloat(item.priceAtOrder) || 0,
                                    parseInt(item.quantity, 10) || 0,
                                    totalItemPrice,
                                    category,
                                    item.description || null,
                                    processedByQuickSale,
                                    'Hızlı Satış',
                                    quickSaleTimestamp
                                ]
                            );
                        }
                        await clientQuickSaleDB.query('COMMIT');
                        console.log(`${currentUserInfo.username} tarafından hızlı satış tamamlandı ve sales_log'a kaydedildi.`);
                        ws.send(JSON.stringify({ type: 'quick_sale_success', payload: { message: 'Hızlı satış tamamlandı.'} }));
                    } catch (error) { /* ... */ } finally { clientQuickSaleDB.release(); }
                } else { /* ... */ }
                break;

            case 'get_sales_report':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { /* ... */ return; }
                try {
                    const reportResult = await pool.query(
                        // TO_CHAR ile formatlama istemciye bırakılabilir, istemcideki formatTimestamp daha esnek.
                        // `SELECT id, ..., sale_timestamp FROM sales_log ORDER BY sale_timestamp DESC`
                        `SELECT id, item_name, item_price, quantity, total_item_price, category, description,
                                waiter_username, table_name, TO_CHAR(sale_timestamp, 'DD.MM.YYYY HH24:MI:SS') as sale_timestamp
                         FROM sales_log ORDER BY sale_timestamp DESC`
                    );
                    ws.send(JSON.stringify({ type: 'sales_report_data', payload: { sales: reportResult.rows } }));
                } catch (error) { /* ... */ }
                break;

            case 'export_completed_orders': // Bu case'in istemci tarafında bir karşılığı var mı kontrol edilmeli
                if (currentUserInfo && currentUserInfo.role === 'cashier') {
                    try {
                        const exportResult = await pool.query(
                            `SELECT id, item_name, item_price, quantity, total_item_price, category, description,
                                    waiter_username, table_name, TO_CHAR(sale_timestamp, 'DD.MM.YYYY HH24:MI:SS') as sale_timestamp
                             FROM sales_log ORDER BY sale_timestamp DESC`
                        );
                        ws.send(JSON.stringify({ type: 'exported_data', payload: { completedOrders: exportResult.rows } }));
                    } catch (error) { /* ... */ }
                } else { /* ... */ }
                break;

            case 'add_product_to_main_menu':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { /* ... */ return; }
                if (payload && payload.name && typeof payload.price === 'number' && payload.price >= 0 && payload.category) {
                    try {
                        const result = await pool.query(
                            'INSERT INTO products (name, price, category) VALUES ($1, $2, $3) RETURNING *',
                            [payload.name.toUpperCase(), parseFloat(payload.price), payload.category.toUpperCase()]
                        );
                        await broadcastProductsUpdate(); // Tüm istemcilere güncel listeyi gönder
                        ws.send(JSON.stringify({ type: 'main_menu_product_added', payload: { product: result.rows[0], message: `${result.rows[0].name} menüye eklendi.` } }));
                    } catch (err) { /* ... */ }
                } else { /* ... */ }
                break;

           case 'update_main_menu_product':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { /* ... */ return; }
                if (payload && payload.id && payload.name && typeof payload.price === 'number' && payload.price >= 0 && payload.category) {
                    try {
                        const result = await pool.query(
                            'UPDATE products SET name = $1, price = $2, category = $3 WHERE id = $4 RETURNING *',
                            [payload.name.toUpperCase(), parseFloat(payload.price), payload.category.toUpperCase(), payload.id]
                        );
                        if (result.rowCount === 0) { /* ... */ } else {
                            await broadcastProductsUpdate(); // Tüm istemcilere güncel listeyi gönder
                            ws.send(JSON.stringify({
                                type: 'main_menu_product_updated',
                                payload: { product: result.rows[0], message: `${result.rows[0].name} güncellendi.` }
                            }));
                        }
                    } catch (err) { /* ... */ }
                } else { /* ... */ }
                break;

            // Masa ve Garson yönetimi hala bellekten çalışıyor. Bunların DB'ye taşınması gerekir.
            case 'add_table':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } })); return; }
                if (payload && payload.name && payload.name.trim() !== "") {
                    const newTable = { id: `masa-${nextTableIdCounter++}`, name: payload.name.trim(), type: payload.type || 'bahce', status: "boş", order: [], total: 0, waiterId: null, waiterUsername: null };
                    tables.push(newTable); broadcastTableUpdates();
                    ws.send(JSON.stringify({ type: 'table_operation_success', payload: { message: `${newTable.name} eklendi.` } }));
                } else { ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Geçersiz masa adı.' } }));}
                break;
            case 'edit_table_name':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } })); return; }
                if (payload && payload.tableId && payload.newName && payload.newName.trim() !== "") {
                    const tableToEdit = tables.find(t => t.id === payload.tableId);
                    if (tableToEdit) {
                        tableToEdit.name = payload.newName.trim(); broadcastTableUpdates();
                        ws.send(JSON.stringify({ type: 'table_operation_success', payload: { message: `Masa adı ${tableToEdit.name} olarak güncellendi.` } }));
                    } else { ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Masa bulunamadı.' } }));}
                } else { ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Eksik bilgi.' } }));}
                break;
            case 'delete_table':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.tableId) {
                    const tableIndexToDelete = tables.findIndex(t => t.id === payload.tableId);
                    if (tableIndexToDelete > -1) {
                        if (tables[tableIndexToDelete].status === 'dolu' && tables[tableIndexToDelete].order.length > 0) {
                            ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: `"${tables[tableIndexToDelete].name}" dolu olduğu için silinemez.` } })); return;
                        }
                        const deletedTableName = tables[tableIndexToDelete].name;
                        tables.splice(tableIndexToDelete, 1); broadcastTableUpdates();
                        ws.send(JSON.stringify({ type: 'table_operation_success', payload: { message: `"${deletedTableName}" silindi.` } }));
                    } else { ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Masa bulunamadı.' } }));}
                } else { ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Eksik masa IDsi.' } }));}
                break;
            case 'get_waiters_list':
                if (currentUserInfo && currentUserInfo.role === 'cashier') { broadcastWaitersList(ws); }
                else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } }));}
                break;
            case 'add_waiter':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.username && payload.password) {
                    if (users.find(u => u.username === payload.username)) { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Kullanıcı adı mevcut.' } })); return; }
                    const maxUserId = users.reduce((max, u) => u.id > max ? u.id : max, 0);
                    const newWaiter = { id: maxUserId + 1, username: payload.username, password: payload.password, role: 'waiter' };
                    users.push(newWaiter); broadcastWaitersList();
                    ws.send(JSON.stringify({ type: 'waiter_operation_success', payload: { message: `${newWaiter.username} eklendi.` } }));
                } else { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Eksik bilgi.' } }));}
                break;
            case 'edit_waiter_password':
                 if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.userId && payload.newPassword) {
                    const waiterToEdit = users.find(u => u.id === parseInt(payload.userId) && u.role === 'waiter');
                    if (waiterToEdit) {
                        waiterToEdit.password = payload.newPassword; // Şifre hashlenmeli!
                        ws.send(JSON.stringify({ type: 'waiter_operation_success', payload: { message: `${waiterToEdit.username} şifresi güncellendi.` } }));
                    } else { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Garson bulunamadı.' } }));}
                } else { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Eksik bilgi.' } }));}
                break;
            case 'delete_waiter':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.userId) {
                    const waiterIndexToDelete = users.findIndex(u => u.id === parseInt(payload.userId) && u.role === 'waiter');
                    if (waiterIndexToDelete > -1) {
                        const deletedWaiterName = users[waiterIndexToDelete].username;
                        users.splice(waiterIndexToDelete, 1); broadcastWaitersList();
                        ws.send(JSON.stringify({ type: 'waiter_operation_success', payload: { message: `${deletedWaiterName} silindi.` } }));
                    } else { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Garson bulunamadı.' } }));}
                } else { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Eksik garson IDsi.' } }));}
                break;
            case 'remove_order_item':
                 if (!currentUserInfo) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Giriş yapmalısınız.' } })); return; }
                const tableToRemoveFrom = tables.find(t => t.id === payload.tableId);
                if (tableToRemoveFrom) {
                    const productIdNum = payload.productId === null || payload.productId === 'manual' ? null : parseInt(payload.productId, 10);
                    const itemIndex = tableToRemoveFrom.order.findIndex(item =>
                        ( (productIdNum !== null && item.productId === productIdNum) || (productIdNum === null && item.name === payload.name) ) &&
                        item.description === (payload.description || '')
                    );
                    if (itemIndex > -1) {
                        tableToRemoveFrom.order.splice(itemIndex, 1);
                        tableToRemoveFrom.total = calculateTableTotal(tableToRemoveFrom.order);
                        if (tableToRemoveFrom.order.length === 0) {
                            tableToRemoveFrom.status = 'boş'; tableToRemoveFrom.waiterId = null; tableToRemoveFrom.waiterUsername = null;
                        }
                        broadcastTableUpdates();
                    } else { ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Öğe bulunamadı.' } }));}
                } else { ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Masa bulunamadı.' } }));}
                break;

            case 'logout':
                if (clients.has(ws)) {
                    const loggedOutUser = clients.get(ws);
                    clients.delete(ws);
                    console.log(`Kullanıcı çıkış yaptı: ${loggedOutUser.username}`);
                }
                break;

            default:
                console.log('Bilinmeyen mesaj tipi (default):', type, "Payload:", payload);
                ws.send(JSON.stringify({ type: 'error', payload: { message: `Bilinmeyen mesaj tipi sunucuda işlenemedi: ${type}` } }));
        }
    });

    ws.on('close', () => {
        const closedUser = clients.get(ws);
        if (closedUser) {
            console.log(`İstemci bağlantısı kesildi: ${closedUser.username}`);
        } else {
            console.log('Kimliği doğrulanmamış bir istemcinin bağlantısı kesildi.');
        }
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('Bir WebSocket hatası oluştu:', error);
        clients.delete(ws);
    });
});

// --- HTTP Sunucusunu Başlatma ---
httpServer.listen(HTTP_PORT, () => {
  console.log(`EMET LEZZET GÜNLERİ ADİSYON SİSTEMİ ${HTTP_PORT} portunda dinlemede.`);
});

// Veritabanı bağlantısını düzgün kapatmak için
process.on('SIGINT', async () => {
    console.log('Sunucu kapatılıyor (SIGINT)...');
    await pool.end();
    console.log('PostgreSQL bağlantısı kapatıldı.');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Sunucu kapatılıyor (SIGTERM)...');
    await pool.end();
    console.log('PostgreSQL bağlantısı kapatıldı.');
    process.exit(0);
});
