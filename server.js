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
        // Uygulamanın çökmesini engellemek için burada process.exit() çağrılabilir veya
        // veritabanı olmadan çalışamayacak özellikler devre dışı bırakılabilir.
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

// --- Sunucu Verileri ---
// Kullanıcılar ve Masalar şimdilik bellekte, idealde bunlar da veritabanında olmalı.
let users = [ // Bu veriler idealde veritabanından çekilmeli veya güvenli bir şekilde yönetilmeli
    { id: 1, username: 'onkasa', password: 'onkasa12', role: 'cashier' },
    { id: 2, username: 'arkakasa', password: 'arkakasa12', role: 'cashier' },
    { id: 3, username: 'omerfaruk', password: 'omer.faruk', role: 'waiter' },
    { id: 4, username: 'zeynel', password: 'zey.nel', role: 'waiter' },
    { id: 5, username: 'halil', password: 'ha.lil', role: 'waiter' },
    { id: 6, username: 'garson', password: 'gar.son', role: 'waiter' },
];

// Ürünler artık birincil olarak veritabanından çekilecek.
// products_in_memory_fallback, bazı eski fonksiyonlar tarafından hala referans alınabilir
// ancak yeni implementasyonlar fetchProductsFromDB kullanmalıdır.
// İdealde bu global dizi kaldırılır ve tüm ürün işlemleri DB üzerinden yapılır.
let products_in_memory_fallback = [
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
    // Bu da idealde DB'den 'waiter' rolündeki kullanıcıları çekmeli
    const waiters = users.filter(u => u.role === 'waiter').map(u => ({ id: u.id, username: u.username }));
    const messagePayload = { type: 'waiters_list', payload: { waiters: waiters } };
    if (requestingWs && requestingWs.readyState === WebSocket.OPEN) {
        requestingWs.send(JSON.stringify(messagePayload));
    } else { // Tüm kasalara yayınla
        clients.forEach((userInfo, clientSocket) => {
            if (userInfo && userInfo.role === 'cashier' && clientSocket.readyState === WebSocket.OPEN) {
                try { clientSocket.send(JSON.stringify(messagePayload)); } catch (e) { console.error("Garson listesi gönderilemedi", e); }
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

function getClientIp(ws, req) { // req parametresini ekledik
    try {
        const forwardedFor = req?.headers['x-forwarded-for'];
        if (forwardedFor) {
            return forwardedFor.split(',')[0].trim();
        }
        return ws._socket?.remoteAddress || req?.socket?.remoteAddress || null;
    } catch (e) {
        console.warn("IP adresi alınırken hata:", e);
        return null;
    }
}

async function logActivity(username, actionType, details = {}, targetEntity = null, targetEntityId = null, ipAddress = null) {
    const clientDB = await pool.connect();
    try {
        await clientDB.query(
            `INSERT INTO activity_log (user_username, action_type, target_entity, target_entity_id, log_details, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                username || 'SISTEM',
                actionType,
                targetEntity,
                targetEntityId ? String(targetEntityId) : null,
                JSON.stringify(details),
                ipAddress
            ]
        );
        console.log(`Aktivite Loglandı: [${actionType}] Kullanıcı: ${username || 'SISTEM'}, Detay: ${JSON.stringify(details)}`);
    } catch (error) {
        console.error('!!! Aktivite Loglama Hatası !!!:', error.stack);
    } finally {
        clientDB.release();
    }
}


// --- Ana WebSocket Olay İşleyicisi ---
wss.on('connection', (ws, req) => { // req parametresini IP almak için ekledik
    const clientIpAddress = getClientIp(ws, req);
    console.log(`Yeni bir istemci bağlandı. IP: ${clientIpAddress || 'Bilinmiyor'}`);


    ws.on('message', async (messageAsString) => {
        let message;
        try {
            message = JSON.parse(messageAsString);
            const usernameForLog = clients.get(ws)?.username || (message.payload?.username || 'Bilinmeyen'); // Login öncesi için
            console.log(`Alınan mesaj tipi: ${message.type}, Kullanıcı: ${usernameForLog}, IP: ${clientIpAddress}`);
        } catch (e) {
            console.error('Geçersiz JSON formatı:', messageAsString, e);
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
                            console.log(`Mevcut bağlantı sonlandırılıyor (ID: ${user.id}, Kullanıcı: ${info.username})`);
                            client.terminate(); clients.delete(client);
                        }
                    }
                    const userInfoToSet = { id: user.id, username: user.username, role: user.role, ip: clientIpAddress };
                    clients.set(ws, userInfoToSet);
                    currentUserInfo = userInfoToSet; // Güncel currentUserInfo'yu set et
                    const dbProductsLogin = await fetchProductsFromDB();
                    ws.send(JSON.stringify({ type: 'login_success', payload: { user: currentUserInfo, tables: tables, products: dbProductsLogin }}));
                    console.log(`Kullanıcı giriş yaptı: ${user.username} (Rol: ${user.role}, IP: ${clientIpAddress})`);
                    await logActivity(user.username, 'KULLANICI_GIRIS', { rol: user.role }, 'User', user.id, clientIpAddress);
                } else {
                    ws.send(JSON.stringify({ type: 'login_fail', payload: { error: 'Kullanıcı adı veya şifre hatalı.' } }));
                    await logActivity(payload.username, 'KULLANICI_GIRIS_BASARISIZ', { sebep: 'Hatalı şifre/kullanıcı adı' }, 'User', null, clientIpAddress);
                }
                break;

            case 'reauthenticate':
                 if (payload && payload.user && payload.user.id) {
                     const foundUser = users.find(u => u.id === payload.user.id && u.username === payload.user.username);
                     if (foundUser) {
                         for (let [client, info] of clients.entries()) {
                             if (info.id === foundUser.id && client !== ws) { client.terminate(); clients.delete(client); }
                         }
                         const userInfoToSetReauth = { ...payload.user, ip: clientIpAddress };
                         clients.set(ws, userInfoToSetReauth);
                         currentUserInfo = userInfoToSetReauth; // Güncel currentUserInfo'yu set et
                         const dbProductsReauth = await fetchProductsFromDB();
                         ws.send(JSON.stringify({ type: 'tables_update', payload: { tables: tables } }));
                         ws.send(JSON.stringify({ type: 'products_update', payload: { products: dbProductsReauth } }));
                         console.log(`Kullanıcı oturumu sürdürdü: ${currentUserInfo.username} (IP: ${clientIpAddress})`);
                     } else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Geçersiz oturum bilgisi.' } }));}
                 } else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Eksik oturum bilgisi.' } }));}
                break;

            case 'get_products':
                try {
                    const dbProducts = await fetchProductsFromDB();
                    ws.send(JSON.stringify({ type: 'products_update', payload: { products: dbProducts } }));
                    console.log('Sunucu: get_products isteğine products_update mesaj tipiyle yanıt verildi.');
                } catch (err) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Ürünler getirilemedi.' } }));
                }
                break;

            case 'get_users':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } }));
                    return;
                }
                ws.send(JSON.stringify({ type: 'users_list', payload: { users: users.map(u => ({id: u.id, username: u.username, role: u.role})) } }));
                break;

            case 'add_order_item':
                if (!currentUserInfo) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Giriş yapmalısınız.' } })); return; }
                const tableToAdd = tables.find(t => t.id === payload.tableId);
                const receivedProductId = parseInt(payload.productId, 10);
                if (isNaN(receivedProductId)) { ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Geçersiz ürün IDsi.' } })); return; }
                
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
                    await logActivity(currentUserInfo.username, 'SIPARIS_URUN_EKLENDI',
                        { masa: tableToAdd.name, urun_id: productToAdd.id, urun_adi: productToAdd.name, adet: payload.quantity, fiyat: productToAdd.price, aciklama: payload.description || '' },
                        'Order', tableToAdd.id, clientIpAddress
                    );
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
                    await logActivity(currentUserInfo.username, 'SIPARIS_MANUEL_URUN_EKLENDI',
                        { masa: tableForManual.name, urun_adi: payload.name, adet: payload.quantity, fiyat: payload.price, kategori: payload.category || 'Diğer', aciklama: payload.description || '' },
                        'Order', tableForManual.id, clientIpAddress
                    );
                } else { ws.send(JSON.stringify({ type: 'manual_order_update_fail', payload: { error: 'Geçersiz manuel ürün bilgileri.' } }));}
                break;

            case 'remove_order_item':
                 if (!currentUserInfo) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Giriş yapmalısınız.' } })); return; }
                const tableToRemoveFrom = tables.find(t => t.id === payload.tableId);
                if (tableToRemoveFrom) {
                    const productIdNum = payload.productId === null || payload.productId === 'manual' ? null : parseInt(payload.productId, 10);
                    let removedItemDetails = {};
                    const itemIndex = tableToRemoveFrom.order.findIndex(item => {
                        const match = ( (productIdNum !== null && item.productId === productIdNum) || (productIdNum === null && item.name === payload.name) ) &&
                                      item.description === (payload.description || '');
                        if (match) {
                            removedItemDetails = { name: item.name, quantity: item.quantity, price: item.priceAtOrder, description: item.description };
                        }
                        return match;
                    });

                    if (itemIndex > -1) {
                        tableToRemoveFrom.order.splice(itemIndex, 1);
                        tableToRemoveFrom.total = calculateTableTotal(tableToRemoveFrom.order);
                        if (tableToRemoveFrom.order.length === 0) {
                            tableToRemoveFrom.status = 'boş'; tableToRemoveFrom.waiterId = null; tableToRemoveFrom.waiterUsername = null;
                        }
                        broadcastTableUpdates();
                        await logActivity(currentUserInfo.username, 'SIPARIS_URUN_SILINDI',
                            { masa: tableToRemoveFrom.name, silinen_urun: removedItemDetails },
                            'Order', tableToRemoveFrom.id, clientIpAddress
                        );
                    } else { ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Öğe bulunamadı.' } }));}
                } else { ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Masa bulunamadı.' } }));}
                break;

            case 'close_table':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } })); return;
                }
                const tableToClose = tables.find(t => t.id === payload.tableId);
                if (tableToClose && tableToClose.order && tableToClose.order.length > 0) {
                    const closingTime = new Date();
                    const tableName = tableToClose.name;
                    const processedBy = tableToClose.waiterUsername || currentUserInfo.username;
                    const orderDetailsForLog = tableToClose.order.map(item => ({name: item.name, quantity: item.quantity, price: item.priceAtOrder, total: (parseFloat(item.priceAtOrder) || 0) * (parseInt(item.quantity,10) || 0) }));
                    const tableTotalForLog = calculateTableTotal(tableToClose.order);

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
                                    closingTime
                                ]
                            );
                        }
                        await clientDB.query('COMMIT');
                        console.log(`${tableName} masasındaki satışlar sales_log'a kaydedildi.`);

                        await logActivity(currentUserInfo.username, 'MASA_KAPATILDI_VE_SATIS_KAYDEDILDI',
                            { masa_adi: tableName, toplam_tutar: tableTotalForLog, siparis_detaylari: orderDetailsForLog },
                            'Table', payload.tableId, clientIpAddress
                        );

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
                } else if (tableToClose && (!tableToClose.order || tableToClose.order.length === 0)) {
                     ws.send(JSON.stringify({ type: 'error', payload: { message: 'Boş masa kapatılamaz.' } }));
                } else {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Kapatılacak masa bulunamadı.' } }));
                }
                break;

            case 'complete_quick_sale':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
                    const quickSaleTimestamp = new Date();
                    const processedByQuickSale = payload.cashierUsername || currentUserInfo.username;
                    const clientQuickSaleDB = await pool.connect();
                    try {
                        await clientQuickSaleDB.query('BEGIN');
                        const currentProductsListQuickSale = await fetchProductsFromDB();
                        let totalQuickSaleAmount = 0;
                        const quickSaleItemsForLog = [];

                        for (const item of payload.items) {
                            const itemPrice = parseFloat(item.priceAtOrder) || 0;
                            const itemQuantity = parseInt(item.quantity, 10) || 0;
                            const totalItemPrice = itemPrice * itemQuantity;
                            totalQuickSaleAmount += totalItemPrice;
                            quickSaleItemsForLog.push({name: item.name, quantity: itemQuantity, price: itemPrice, total: totalItemPrice});

                            const productDetails = currentProductsListQuickSale.find(p => p.id === item.productId);
                            const category = item.category || (productDetails ? productDetails.category : 'Hızlı Satış');
                            await clientQuickSaleDB.query(
                                `INSERT INTO sales_log (item_name, item_price, quantity, total_item_price, category, description, waiter_username, table_name, sale_timestamp)
                                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                                [
                                    item.name || (productDetails ? productDetails.name : 'Bilinmeyen Ürün'),
                                    itemPrice,
                                    itemQuantity,
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
                        await logActivity(currentUserInfo.username, 'HIZLI_SATIS_TAMAMLANDI',
                            { urun_detaylari: quickSaleItemsForLog, toplam_tutar: totalQuickSaleAmount },
                            'QuickSale', null, clientIpAddress
                        );
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
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Rapor görüntüleme yetkiniz yok.' } })); return; }
                try {
                    const reportResult = await pool.query(
                        `SELECT id, item_name, item_price, quantity, total_item_price, category, description,
                                waiter_username, table_name, sale_timestamp
                         FROM sales_log ORDER BY sale_timestamp DESC` // TO_CHAR kaldırıldı, ham timestamp gönderilecek
                    );
                    ws.send(JSON.stringify({ type: 'sales_report_data', payload: { sales: reportResult.rows } }));
                } catch (error) {
                    console.error("Satış raporu alınırken hata:", error);
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Rapor alınırken bir veritabanı sorunu oluştu.' } }));
                }
                break;

            case 'get_activity_log':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Log görüntüleme yetkiniz yok.' } }));
                    return;
                }
                try {
                    const logResult = await pool.query(
                        `SELECT log_id, user_username, action_type, log_details, log_timestamp, ip_address
                         FROM activity_log ORDER BY log_timestamp DESC LIMIT 200`
                    );
                    // Ham TIMESTAMPTZ gönder, istemci formatlasın
                    ws.send(JSON.stringify({ type: 'activity_log_data', payload: { logs: logResult.rows } }));
                } catch (error) {
                    console.error("Aktivite logları alınırken hata:", error);
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Loglar alınırken bir veritabanı sorunu oluştu.' } }));
                }
                break;

            case 'add_product_to_main_menu':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.name && typeof payload.price === 'number' && payload.price >= 0 && payload.category) {
                    try {
                        const result = await pool.query(
                            'INSERT INTO products (name, price, category) VALUES ($1, $2, $3) RETURNING *',
                            [payload.name.toUpperCase(), parseFloat(payload.price), payload.category.toUpperCase()]
                        );
                        const newProduct = result.rows[0];
                        await logActivity(
                            currentUserInfo.username,
                            'URUN_EKLENDI_MENUYE',
                            { urun_id: newProduct.id, urun_adi: newProduct.name, fiyat: newProduct.price, kategori: newProduct.category },
                            'Product',
                            newProduct.id,
                            clientIpAddress
                        );
                        await broadcastProductsUpdate();
                        ws.send(JSON.stringify({ type: 'main_menu_product_added', payload: { product: newProduct, message: `${newProduct.name} menüye eklendi.` } }));
                    } catch (err) {
                        console.error("Ürün eklenirken hata:", err);
                        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Ürün eklenemedi.' } }));
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Eksik ürün bilgisi.' } }));
                }
                break;

           case 'update_main_menu_product':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.id && payload.name && typeof payload.price === 'number' && payload.price >= 0 && payload.category) {
                    const clientDB = await pool.connect();
                    try {
                        await clientDB.query('BEGIN');
                        const oldProductResult = await clientDB.query('SELECT name, price, category FROM products WHERE id = $1 FOR UPDATE', [payload.id]);
                        if (oldProductResult.rowCount === 0) {
                            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Güncellenecek ürün bulunamadı.' } }));
                            await clientDB.query('ROLLBACK'); return;
                        }
                        const oldProduct = oldProductResult.rows[0];

                        const result = await clientDB.query(
                            'UPDATE products SET name = $1, price = $2, category = $3 WHERE id = $4 RETURNING *',
                            [payload.name.toUpperCase(), parseFloat(payload.price), payload.category.toUpperCase(), payload.id]
                        );
                        const updatedProduct = result.rows[0];
                        await clientDB.query('COMMIT');

                        await logActivity(
                            currentUserInfo.username,
                            'URUN_GUNCELLEME_MENU',
                            {
                                urun_id: updatedProduct.id,
                                urun_adi_yeni: updatedProduct.name,
                                eski_degerler: { name: oldProduct.name, price: oldProduct.price, category: oldProduct.category },
                                yeni_degerler: { name: updatedProduct.name, price: updatedProduct.price, category: updatedProduct.category }
                            },
                            'Product',
                            updatedProduct.id,
                            clientIpAddress
                        );
                        await broadcastProductsUpdate();
                        ws.send(JSON.stringify({ type: 'main_menu_product_updated', payload: { product: updatedProduct, message: `${updatedProduct.name} güncellendi.` } }));
                    } catch (err) {
                        await clientDB.query('ROLLBACK');
                        console.error("Ürün güncellenirken hata:", err);
                        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Ürün güncellenemedi.' } }));
                    } finally {
                        clientDB.release();
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Eksik ürün bilgisi.' } }));
                }
                break;

            // Masa ve Garson yönetimi hala bellekten çalışıyor. Bunların DB'ye taşınması ve loglanması gerekir.
            case 'add_table':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } })); return; }
                if (payload && payload.name && payload.name.trim() !== "") {
                    const newTableName = payload.name.trim();
                    const newTable = { id: `masa-${nextTableIdCounter++}`, name: newTableName, type: payload.type || 'bahce', status: "boş", order: [], total: 0, waiterId: null, waiterUsername: null };
                    tables.push(newTable);
                    broadcastTableUpdates();
                    ws.send(JSON.stringify({ type: 'table_operation_success', payload: { message: `${newTableName} eklendi.` } }));
                    await logActivity(currentUserInfo.username, 'MASA_EKLENDI_BELLEK', { masa_adi: newTableName, masa_tipi: newTable.type }, 'TableDefinition', newTable.id, clientIpAddress);
                } else { ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Geçersiz masa adı.' } }));}
                break;
            case 'edit_table_name':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } })); return; }
                if (payload && payload.tableId && payload.newName && payload.newName.trim() !== "") {
                    const tableToEdit = tables.find(t => t.id === payload.tableId);
                    if (tableToEdit) {
                        const oldName = tableToEdit.name;
                        const newName = payload.newName.trim();
                        tableToEdit.name = newName;
                        broadcastTableUpdates();
                        ws.send(JSON.stringify({ type: 'table_operation_success', payload: { message: `Masa adı ${newName} olarak güncellendi.` } }));
                        await logActivity(currentUserInfo.username, 'MASA_ADI_GUNCELLEME_BELLEK', { masa_id: tableToEdit.id, eski_ad: oldName, yeni_ad: newName }, 'TableDefinition', tableToEdit.id, clientIpAddress);
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
                        const deletedTable = tables.splice(tableIndexToDelete, 1)[0];
                        broadcastTableUpdates();
                        ws.send(JSON.stringify({ type: 'table_operation_success', payload: { message: `"${deletedTable.name}" silindi.` } }));
                        await logActivity(currentUserInfo.username, 'MASA_SILINDI_BELLEK', { masa_id: deletedTable.id, masa_adi: deletedTable.name }, 'TableDefinition', deletedTable.id, clientIpAddress);
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
                    const maxUserId = users.length > 0 ? users.reduce((max, u) => u.id > max ? u.id : max, 0) : 0;
                    const newWaiter = { id: maxUserId + 1, username: payload.username, password: payload.password, role: 'waiter' };
                    users.push(newWaiter);
                    broadcastWaitersList();
                    ws.send(JSON.stringify({ type: 'waiter_operation_success', payload: { message: `${newWaiter.username} eklendi.` } }));
                    await logActivity(currentUserInfo.username, 'GARSON_EKLENDI_BELLEK', { garson_kullanici_adi: newWaiter.username, garson_id: newWaiter.id }, 'User', newWaiter.id, clientIpAddress);
                } else { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Eksik bilgi.' } }));}
                break;
            case 'edit_waiter_password':
                 if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.userId && payload.newPassword) {
                    const waiterToEdit = users.find(u => u.id === parseInt(payload.userId) && u.role === 'waiter');
                    if (waiterToEdit) {
                        const oldPassword = waiterToEdit.password; // Sadece loglama için, gerçekte hashlenmeli
                        waiterToEdit.password = payload.newPassword; // Şifre hashlenmeli!
                        ws.send(JSON.stringify({ type: 'waiter_operation_success', payload: { message: `${waiterToEdit.username} şifresi güncellendi.` } }));
                        await logActivity(currentUserInfo.username, 'GARSON_SIFRE_GUNCELLEME_BELLEK', { garson_kullanici_adi: waiterToEdit.username, garson_id: waiterToEdit.id }, 'User', waiterToEdit.id, clientIpAddress);
                    } else { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Garson bulunamadı.' } }));}
                } else { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Eksik bilgi.' } }));}
                break;
            case 'delete_waiter':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.userId) {
                    const waiterIdToDelete = parseInt(payload.userId);
                    const waiterIndexToDelete = users.findIndex(u => u.id === waiterIdToDelete && u.role === 'waiter');
                    if (waiterIndexToDelete > -1) {
                        const deletedWaiter = users.splice(waiterIndexToDelete, 1)[0];
                        broadcastWaitersList();
                        ws.send(JSON.stringify({ type: 'waiter_operation_success', payload: { message: `${deletedWaiter.username} silindi.` } }));
                        await logActivity(currentUserInfo.username, 'GARSON_SILINDI_BELLEK', { garson_kullanici_adi: deletedWaiter.username, garson_id: deletedWaiter.id }, 'User', deletedWaiter.id, clientIpAddress);
                    } else { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Garson bulunamadı.' } }));}
                } else { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Eksik garson IDsi.' } }));}
                break;

            case 'logout':
                if (currentUserInfo) { // currentUserInfo null değilse logla
                    await logActivity(currentUserInfo.username, 'KULLANICI_CIKIS', {}, 'User', currentUserInfo.id, currentUserInfo.ip);
                    clients.delete(ws);
                    console.log(`Kullanıcı çıkış yaptı: ${currentUserInfo.username}`);
                } else if (clients.has(ws)) { // Eğer currentUserInfo null ama client map'te varsa
                    const deletedClientInfo = clients.get(ws);
                    clients.delete(ws);
                    console.log(`Kimliği doğrulanmamış/eksik bilgili istemci çıkış yaptı (map'ten silindi). IP: ${deletedClientInfo?.ip || clientIpAddress}`);
                }
                break;

            default:
                console.log('Bilinmeyen mesaj tipi (default):', type, "Payload:", payload);
                ws.send(JSON.stringify({ type: 'error', payload: { message: `Bilinmeyen mesaj tipi sunucuda işlenemedi: ${type}` } }));
        }
    });

    ws.on('close', async () => {
        const closedUserInfo = clients.get(ws);
        if (closedUserInfo) {
            console.log(`İstemci bağlantısı kesildi: ${closedUserInfo.username} (IP: ${closedUserInfo.ip})`);
            // Otomatik çıkış logu, eğer 'logout' mesajı ile gelmediyse ve kullanıcı bilgisi varsa
            // await logActivity(closedUserInfo.username, 'BAGLANTI_KESILDI', {}, 'User', closedUserInfo.id, closedUserInfo.ip);
        } else {
            console.log(`Kimliği doğrulanmamış bir istemcinin bağlantısı kesildi. (IP: ${clientIpAddress})`);
        }
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        const errorUserInfo = clients.get(ws);
        console.error(`Bir WebSocket hatası oluştu. Kullanıcı: ${errorUserInfo?.username || 'Bilinmiyor'}, IP: ${errorUserInfo?.ip || clientIpAddress}`, error);
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

