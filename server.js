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
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false // Render PostgreSQL için SSL
});

pool.connect()
    .then(() => console.log('PostgreSQL veritabanına başarıyla bağlandı! (sales_log için)'))
    .catch(err => {
        console.error('!!! VERİTABANI BAĞLANTI HATASI (sales_log için) !!!:', err.stack);
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
let users = [
    { id: 1, username: 'onkasa', password: 'onkasa12', role: 'cashier' },
    { id: 2, username: 'arkakasa', password: 'arkakasa12', role: 'cashier' },
    { id: 3, username: 'omerfaruk', password: 'omer.faruk', role: 'waiter' },
    { id: 4, username: 'zeynel', password: 'zey.nel', role: 'waiter' },
    { id: 5, username: 'halil', password: 'ha.lil', role: 'waiter' },
    { id: 6, username: 'garson', password: 'gar.son', role: 'waiter' },
];

let products = [
    { id: 1001, name: "İSKENDER - 120 GR", price: 275.00, category: "ET - TAVUK" },
    { id: 1002, name: "ET DÖNER EKMEK ARASI", price: 150.00, category: "ET - TAVUK" },
    { id: 1003, name: "ET DÖNER PORSİYON", price: 175.00, category: "ET - TAVUK" },
    { id: 1004, name: "TAVUK DÖNER EKMEK ARASI", price: 130.00, category: "ET - TAVUK" },
    { id: 1005, name: "TAVUK DÖNER PORSİYON", price: 150.00, category: "ET - TAVUK" },
    { id: 1006, name: "KÖFTE EKMEK", price: 130.00, category: "ET - TAVUK" },
    { id: 1007, name: "KÖFTE PORSİYON", price: 150.00, category: "ET - TAVUK" },
    { id: 1008, name: "KUZU ŞİŞ", price: 150.00, category: "ET - TAVUK" },
    { id: 1009, name: "ADANA ŞİŞ", price: 150.00, category: "ET - TAVUK" },
    { id: 1010, name: "PİRZOLA - 4 ADET", price: 250.00, category: "ET - TAVUK" },
    { id: 1011, name: "TAVUK FAJİTA", price: 200.00, category: "ET - TAVUK" },
    { id: 1012, name: "TAVUK (PİLİÇ) ÇEVİRME", price: 250.00, category: "ET - TAVUK" },
    { id: 1013, name: "ET DÖNER - KG", price: 1300.00, category: "ET - TAVUK" },
    { id: 1014, name: "ET DÖNER - 500 GR", price: 650.00, category: "ET - TAVUK" },
    { id: 1015, name: "TAVUK DÖNER - KG", price: 800.00, category: "ET - TAVUK" },
    { id: 1016, name: "TAVUK DÖNER - 500 GR", price: 400.00, category: "ET - TAVUK" },
    { id: 2001, name: "PİZZA KARIŞIK (ORTA BOY)", price: 150.00, category: "ATIŞTIRMALIK" },
    { id: 2002, name: "PİZZA KARIŞIK (BÜYÜK BOY)", price: 200.00, category: "ATIŞTIRMALIK" },
    { id: 2003, name: "LAHMACUN", price: 75.00, category: "ATIŞTIRMALIK" },
    { id: 2004, name: "PİDE ÇEŞİTLERİ", price: 100.00, category: "ATIŞTIRMALIK" },
    { id: 2005, name: "AYVALIK TOSTU", price: 100.00, category: "ATIŞTIRMALIK" },
    { id: 2006, name: "HAMBURGER", price: 120.00, category: "ATIŞTIRMALIK" },
    { id: 2007, name: "ÇİĞ KÖFTE KG (MARUL-LİMON)", price: 300.00, category: "ATIŞTIRMALIK" },
    { id: 3001, name: "OSMANLI ŞERBETİ - 1 LİTRE", price: 75.00, category: "İÇECEK" },
    { id: 3002, name: "LİMONATA", price: 75.00, category: "İÇECEK" },
    { id: 3003, name: "SU", price: 10.00, category: "İÇECEK" },
    { id: 3004, name: "AYRAN", price: 15.00, category: "İÇECEK" },
    { id: 3005, name: "ÇAY", price: 10.00, category: "İÇECEK" },
    { id: 3006, name: "GAZOZ", price: 25.00, category: "İÇECEK" },
    { id: 4001, name: "EV BAKLAVASI - KG", price: 400.00, category: "TATLI" },
    { id: 4002, name: "EV BAKLAVASI - 500 GRAM", price: 200.00, category: "TATLI" },
    { id: 4003, name: "EV BAKLAVASI - PORSİYON", price: 75.00, category: "TATLI" },
    { id: 4004, name: "AŞURE - 500 GRAM", price: 100.00, category: "TATLI" },
    { id: 4005, name: "HÖŞMERİM - 500 GRAM", price: 100.00, category: "TATLI" },
    { id: 4006, name: "DİĞER PASTA ÇEŞİTLERİ", price: 50.00, category: "TATLI" },
    { id: 4007, name: "YAĞLI GÖZLEME", price: 50.00, category: "TATLI" },
    { id: 4008, name: "İÇLİ GÖZLEME", price: 60.00, category: "TATLI" },
    { id: 5001, name: "KELLE PAÇA ÇORBA", price: 60.00, category: "ÇORBA" },
    { id: 5002, name: "TARHANA ÇORBA", price: 60.00, category: "ÇORBA" }
];

let tables = [];
let nextTableIdCounter = 1;

function initializeTables() {
    tables = [];
    let currentId = 1;
    for (let i = 1; i <= 5; i++) {
        tables.push({ id: `masa-${currentId++}`, name: `Kamelya ${i}`, type: 'kamelya', status: "boş", order: [], total: 0, waiterId: null, waiterUsername: null });
    }
    for (let i = 1; i <= 16; i++) {
        tables.push({ id: `masa-${currentId++}`, name: `Bahçe ${i}`, type: 'bahce', status: "boş", order: [], total: 0, waiterId: null, waiterUsername: null });
    }
    nextTableIdCounter = currentId;
    console.log(`${tables.length} masa bellekte oluşturuldu.`);
}
initializeTables();

const clients = new Map();

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

function broadcastProductsUpdate() {
    broadcast({ type: 'products_update', payload: { products: products } });
}

function broadcastWaitersList(requestingWs) {
    const waiters = users.filter(u => u.role === 'waiter').map(u => ({ id: u.id, username: u.username }));
    const messagePayload = { type: 'waiters_list', payload: { waiters: waiters } };
    if (requestingWs) {
        requestingWs.send(JSON.stringify(messagePayload));
    } else {
        clients.forEach((userInfo, clientSocket) => {
            if (userInfo && userInfo.role === 'cashier' && clientSocket.readyState === WebSocket.OPEN) {
                clientSocket.send(JSON.stringify(messagePayload));
            }
        });
    }
}

function calculateTableTotal(order) {
    return order.reduce((sum, item) => {
        const price = item.priceAtOrder || 0;
        return sum + (price * item.quantity);
    }, 0);
}

wss.on('connection', (ws) => {
    console.log('Yeni bir istemci bağlandı (WebSocket).');

    ws.on('message', async (messageAsString) => { // async yaptık çünkü DB işlemleri olacak
        let message;
        try {
            message = JSON.parse(messageAsString);
            console.log('Alınan mesaj:', message);
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
                        if (info.id === user.id && client !== ws) {
                            client.terminate(); clients.delete(client);
                        }
                    }
                    clients.set(ws, { id: user.id, username: user.username, role: user.role });
                    currentUserInfo = clients.get(ws);
                    ws.send(JSON.stringify({
                        type: 'login_success',
                        payload: { user: currentUserInfo, tables: tables, products: products }
                    }));
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
                         ws.send(JSON.stringify({ type: 'tables_update', payload: { tables: tables } }));
                         ws.send(JSON.stringify({ type: 'products_update', payload: { products: products } }));
                     } else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Geçersiz oturum bilgisi.' } }));}
                 } else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Eksik oturum bilgisi.' } }));}
                break;

            case 'get_products':
                ws.send(JSON.stringify({ type: 'products_update', payload: { products: products } }));
                break;

            case 'add_order_item':
                if (!currentUserInfo) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Giriş yapmalısınız.' } })); return; }
                const tableToAdd = tables.find(t => t.id === payload.tableId);
                const receivedProductId = parseInt(payload.productId, 10);
                if (isNaN(receivedProductId)) { ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Geçersiz ürün IDsi.' } })); return; }
                const productToAdd = products.find(p => p.id === receivedProductId);
                if (tableToAdd && productToAdd && payload.quantity > 0) {
                    const existingItem = tableToAdd.order.find(item => item.productId === receivedProductId && item.description === (payload.description || ''));
                    if (existingItem) {
                        existingItem.quantity += payload.quantity;
                        existingItem.waiterUsername = currentUserInfo.username;
                        existingItem.timestamp = Date.now();
                    } else {
                        tableToAdd.order.push({
                            productId: receivedProductId, name: productToAdd.name, quantity: payload.quantity,
                            priceAtOrder: productToAdd.price, description: payload.description || '',
                            category: productToAdd.category, waiterUsername: currentUserInfo.username, timestamp: Date.now()
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
                if (tableForManual && payload.name && payload.price >= 0 && payload.quantity > 0) {
                     tableForManual.order.push({
                         name: payload.name, quantity: payload.quantity, priceAtOrder: payload.price,
                         description: payload.description || '', category: payload.category || 'Diğer',
                         waiterUsername: currentUserInfo.username, timestamp: Date.now()
                     });
                    tableForManual.total = calculateTableTotal(tableForManual.order);
                    tableForManual.status = 'dolu';
                    tableForManual.waiterId = currentUserInfo.id; tableForManual.waiterUsername = currentUserInfo.username;
                    broadcastTableUpdates();
                } else { ws.send(JSON.stringify({ type: 'manual_order_update_fail', payload: { error: 'Geçersiz bilgi.' } }));}
                break;

            case 'add_product_to_main_menu': // Bu hala bellekte çalışacak
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.name && typeof payload.price === 'number' && payload.price >= 0 && payload.category) {
                    const maxId = products.reduce((max, p) => p.id > max ? p.id : max, 0);
                    const newProductId = maxId < 7000 ? 7001 : maxId + 1; // Basit ID üretimi
                    const newProduct = { id: newProductId, name: payload.name.toUpperCase(), price: parseFloat(payload.price), category: payload.category.toUpperCase() };
                    products.push(newProduct); // Belleğe ekle
                    broadcastProductsUpdate();
                    ws.send(JSON.stringify({ type: 'main_menu_product_added', payload: { product: newProduct, message: `${newProduct.name} menüye eklendi.` } }));
                } else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Eksik ürün bilgisi.' } }));}
                break;

            case 'update_main_menu_product': // Bu hala bellekte çalışacak
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.id && payload.name && typeof payload.price === 'number' && payload.price >= 0 && payload.category) {
                    const productIndex = products.findIndex(p => p.id === parseInt(payload.id));
                    if (productIndex > -1) {
                        products[productIndex].name = payload.name.toUpperCase();
                        products[productIndex].price = parseFloat(payload.price);
                        products[productIndex].category = payload.category.toUpperCase();
                        broadcastProductsUpdate();
                        ws.send(JSON.stringify({ type: 'main_menu_product_updated', payload: { product: products[productIndex], message: `${products[productIndex].name} güncellendi.` } }));
                    } else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Ürün bulunamadı.' } }));}
                } else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Eksik ürün bilgisi.' } }));}
                break;

            // Diğer yönetim case'leri (add_table, edit_table_name, delete_table, add_waiter vb.)
            // şimdilik bellekte çalışmaya devam edecek. İsterseniz bunlar da DB'ye entegre edilebilir ama daha fazla kod gerektirir.

            case 'add_table':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.name && payload.name.trim() !== "") {
                    const newTable = { id: `masa-${nextTableIdCounter++}`, name: payload.name.trim(), type: payload.type || 'bahce', status: "boş", order: [], total: 0, waiterId: null, waiterUsername: null };
                    tables.push(newTable); broadcastTableUpdates();
                    ws.send(JSON.stringify({ type: 'table_operation_success', payload: { message: `${newTable.name} eklendi.` } }));
                } else { ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Geçersiz masa adı.' } }));}
                break;

            // ... (edit_table_name, delete_table, get_waiters_list, add_waiter, edit_waiter_password, delete_waiter, remove_order_item case'leriniz aynı kalabilir)


            // --- SATIŞ KAYIT VE RAPORLAMA İÇİN GÜNCELLENMİŞ CASE'LER ---
            case 'close_table':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } }));
                    return;
                }
                const tableToClose = tables.find(t => t.id === payload.tableId);
                if (tableToClose && tableToClose.order.length > 0) {
                    const closingTime = new Date();
                    const tableName = tableToClose.name;
                    const processedBy = tableToClose.waiterUsername || currentUserInfo.username;

                    const clientDB = await pool.connect();
                    try {
                        await clientDB.query('BEGIN');
                        for (const item of tableToClose.order) {
                            const totalItemPrice = (item.priceAtOrder || 0) * item.quantity;
                            await clientDB.query(
                                `INSERT INTO sales_log (item_name, item_price, quantity, total_item_price, category, description, waiter_username, table_name, sale_timestamp)
                                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                                [
                                    item.name || 'Bilinmeyen Ürün',
                                    item.priceAtOrder || 0,
                                    item.quantity,
                                    totalItemPrice,
                                    item.category || 'Diğer',
                                    item.description || null,
                                    item.waiterUsername || processedBy, // Kalemi ekleyen veya masayı kapatan
                                    tableName,
                                    closingTime
                                ]
                            );
                        }
                        await clientDB.query('COMMIT');
                        console.log(`${tableName} masasındaki satışlar sales_log'a kaydedildi.`);

                        // Bellekteki masayı sıfırla
                        tableToClose.order = [];
                        tableToClose.total = 0;
                        tableToClose.status = 'boş';
                        tableToClose.waiterId = null; tableToClose.waiterUsername = null;
                        broadcastTableUpdates();
                    } catch (error) {
                        await clientDB.query('ROLLBACK');
                        console.error(`Satış logu kaydedilirken DB hatası (Masa: ${tableName}):`, error);
                        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Satışlar kaydedilirken bir veritabanı sorunu oluştu.' } }));
                    } finally {
                        clientDB.release();
                    }
                } else if (tableToClose && tableToClose.order.length === 0) {
                     ws.send(JSON.stringify({ type: 'error', payload: { message: 'Boş masa kapatılamaz.' } }));
                } else {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Kapatılacak masa bulunamadı.' } }));
                }
                break;

            case 'complete_quick_sale':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } }));
                    return;
                }
                if (payload && payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
                    const quickSaleTimestamp = new Date();
                    const processedByQuickSale = payload.cashierUsername || currentUserInfo.username;

                    const clientQuickSaleDB = await pool.connect();
                    try {
                        await clientQuickSaleDB.query('BEGIN');
                        for (const item of payload.items) {
                            const totalItemPrice = (item.priceAtOrder || 0) * item.quantity;
                            await clientQuickSaleDB.query(
                                `INSERT INTO sales_log (item_name, item_price, quantity, total_item_price, category, description, waiter_username, table_name, sale_timestamp)
                                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                                [
                                    item.name || 'Bilinmeyen Ürün',
                                    item.priceAtOrder || 0,
                                    item.quantity,
                                    totalItemPrice,
                                    item.category || 'Hızlı Satış',
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
                    } catch (error) {
                        await clientQuickSaleDB.query('ROLLBACK');
                        console.error(`Hızlı satış logu kaydedilirken DB hatası:`, error);
                        ws.send(JSON.stringify({ type: 'quick_sale_fail', payload: { error: 'Hızlı satış kaydedilirken bir sorun oluştu.' } }));
                    } finally {
                        clientQuickSaleDB.release();
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'quick_sale_fail', payload: { error: 'Hızlı satış için ürün bulunamadı.' } }));
                }
                break;

            case 'get_sales_report':
                 if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Rapor görüntüleme yetkiniz yok.' } }));
                    return;
                 }
                 try {
                    // TO_CHAR ile zaman damgasını daha okunabilir bir formata çeviriyoruz.
                    const reportResult = await pool.query(
                        `SELECT id, item_name, item_price, quantity, total_item_price, category, description,
                                waiter_username, table_name, TO_CHAR(sale_timestamp, 'DD.MM.YYYY HH24:MI:SS') as sale_timestamp
                         FROM sales_log ORDER BY sale_timestamp DESC`
                    );
                    ws.send(JSON.stringify({ type: 'sales_report_data', payload: { sales: reportResult.rows } }));
                    console.log(`${currentUserInfo.username} için satış raporu (sales_log) gönderildi.`);
                } catch (error) {
                    console.error("Satış raporu (sales_log) DB'den alınırken hata:", error);
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Rapor alınırken bir veritabanı sorunu oluştu.' } }));
                }
                break;

            case 'export_completed_orders':
                if (currentUserInfo && currentUserInfo.role === 'cashier') {
                    try {
                        const exportResult = await pool.query(
                            `SELECT id, item_name, item_price, quantity, total_item_price, category, description,
                                    waiter_username, table_name, TO_CHAR(sale_timestamp, 'DD.MM.YYYY HH24:MI:SS') as sale_timestamp
                             FROM sales_log ORDER BY sale_timestamp DESC`
                        );
                        console.log(`[export_completed_orders] ${exportResult.rows.length} satış kaydı dışa aktarılmak üzere gönderiliyor.`);
                        ws.send(JSON.stringify({ type: 'exported_data', payload: { completedOrders: exportResult.rows } }));
                    } catch (error) {
                        console.error("Dışa aktarma için satış logu DB'den alınırken hata:", error);
                        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Veriler dışa aktarılırken bir sorun oluştu.' } }));
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } }));
                }
                break;
            // --- SATIŞ KAYIT VE RAPORLAMA İÇİN GÜNCELLENMİŞ CASE'LER BİTTİ ---

            case 'logout':
                if (clients.has(ws)) {
                    const loggedOutUser = clients.get(ws);
                    clients.delete(ws);
                    console.log(`Kullanıcı çıkış yaptı: ${loggedOutUser.username}`);
                }
                break;

            default:
                // Eğer default case'e düşen ve yukarıda ele alınmayan (ve değişmeyecek dediğimiz)
                // bir case varsa, o da aynı kalır. Bunun için GitHub'daki kodunuzu referans alın.
                // ÖNEMLİ: Buraya GitHub'daki server.js'inizden
                // remove_order_item, edit_table_name, delete_table, get_waiters_list, add_waiter,
                // edit_waiter_password, delete_waiter
                // gibi case'leri KOPYALAYIP YAPIŞTIRMANIZ GEREKİR. Onlar bellekte çalışmaya devam edecek.
                console.log('Bilinmeyen mesaj tipi (default):', type);
                ws.send(JSON.stringify({ type: 'error', payload: { message: `Bilinmeyen mesaj tipi: ${type}` } }));
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
  console.log(`EMET LEZZET GÜNLERİ Sunucusu ${HTTP_PORT} portunda başlatıldı.`);
});
