// server.js
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');
const { Pool } = require('pg');

const HTTP_PORT = process.env.PORT || 8080;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.connect()
    .then(() => console.log('PostgreSQL veritabanına başarıyla bağlandı! (sales_log ve activity_log için)'))
    .catch(err => {
        console.error('!!! VERİTABANI BAĞLANTI HATASI !!!:', err.stack);
    });

const app = express();
const httpServer = http.createServer(app);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'adisyon.html');
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
    res.sendFile(menuFilePath, (err) => {
        if (err) {
            console.error("Menü dosyası gönderilirken hata:", err);
             if (!res.headersSent) {
                 res.status(err.status || 500).send("Menü dosyası yüklenemedi.");
            }
        }
    });
});

const wss = new WebSocket.Server({ server: httpServer });

console.log(`EMET LEZZET GÜNLERİ HTTP Sunucusu ${HTTP_PORT} portunda başlatıldı.`);
console.log(`WebSocket sunucusu da bu HTTP sunucusu üzerinden çalışıyor.`);

let users = [
    { id: 1, username: 'hamza', password: 'ham.za', role: 'cashier' },
    { id: 2, username: 'bilal', password: 'bil.al', role: 'cashier' },
    { id: 10, username: 'sinan', password: 'sinan12', role: 'cashier' },
    { id: 3, username: 'aykut', password: 'ay.kut', role: 'waiter' },
    { id: 4, username: 'osman', password: 'os.man', role: 'waiter' },
    { id: 5, username: 'omerfaruk', password: 'omer.faruk', role: 'waiter' },
    { id: 6, username: 'zeynel', password: 'zey.nel', role: 'waiter' },
    { id: 7, username: 'dursunali', password: 'd.ali', role: 'waiter' },
    { id: 8, username: 'tevfik', password: 'tev.fik', role: 'waiter' },
    { id: 9, username: 'garson', password: 'gar.son', role: 'waiter' },
    { id: 20, username: 'mutfak', password: 'mut.fak', role: 'kitchen' }
];

let currentProductId = 1000;
let products = [
    { id: ++currentProductId, name: "İSKENDER - 120 GR", price: 275.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "ET DÖNER EKMEK ARASI", price: 150.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "ET DÖNER PORSİYON", price: 175.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "TAVUK DÖNER EKMEK ARASI", price: 130.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "TAVUK DÖNER PORSİYON", price: 150.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "KÖFTE EKMEK", price: 130.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "KÖFTE PORSİYON", price: 150.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "KUZU ŞİŞ", price: 150.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "ADANA ŞİŞ", price: 150.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "PİRZOLA - 4 ADET", price: 250.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "TAVUK FAJİTA", price: 200.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "TAVUK (PİLİÇ) ÇEVİRME", price: 250.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "ET DÖNER - KG", price: 1300.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "ET DÖNER - 500 GR", price: 650.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "TAVUK DÖNER - KG", price: 800.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "TAVUK DÖNER - 500 GR", price: 400.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "AYVALIK TOSTU", price: 120.00, category: "ATIŞTIRMALIK" },
    { id: ++currentProductId, name: "HAMBURGER", price: 150.00, category: "ATIŞTIRMALIK" },
    { id: ++currentProductId, name: "BALIK BURGER", price: 150.00, category: "ATIŞTIRMALIK" },
    { id: ++currentProductId, name: "PİDE ÇEŞİTLERİ", price: 120.00, category: "ATIŞTIRMALIK" },
    { id: ++currentProductId, name: "PİZZA KARIŞIK (ORTA BOY)", price: 150.00, category: "ATIŞTIRMALIK" },
    { id: ++currentProductId, name: "PİZZA KARIŞIK (BÜYÜK BOY)", price: 200.00, category: "ATIŞTIRMALIK" },
    { id: ++currentProductId, name: "LAHMACUN", price: 75.00, category: "ATIŞTIRMALIK" },
    { id: ++currentProductId, name: "ÇİĞ KÖFTE - KG (MARUL-LİMON)", price: 300.00, category: "ATIŞTIRMALIK" },
    { id: ++currentProductId, name: "YAĞLI GÖZLEME", price: 50.00, category: "ATIŞTIRMALIK" },
    { id: ++currentProductId, name: "İÇLİ GÖZLEME", price: 60.00, category: "ATIŞTIRMALIK" },
    { id: ++currentProductId, name: "OSMANLI ŞERBETİ - 1 LT", price: 75.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "LİMONATA - 1 LT", price: 75.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "AYRAN", price: 10.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "SU", price: 10.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "ÇAY", price: 10.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "SOĞUK ÇAY ÇEŞİTLERİ", price: 25.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "TAMEK MEYVE SUYU", price: 25.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "MEYVELİ MADEN SUYU", price: 25.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "NİĞDE GAZOZU", price: 25.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "ŞALGAM", price: 25.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "SADE MADEN SUYU", price: 15.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "TROPİKAL - ÇİLEK KOKUSU", price: 75.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "TROPİKAL - KAVUNEZYA", price: 75.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "TROPİKAL - NAR-I ŞAHANE", price: 75.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "EV BAKLAVASI - KG", price: 400.00, category: "TATLI" },
    { id: ++currentProductId, name: "EV BAKLAVASI - 500 GR", price: 200.00, category: "TATLI" },
    { id: ++currentProductId, name: "EV BAKLAVASI - PORSİYON", price: 75.00, category: "TATLI" },
    { id: ++currentProductId, name: "AŞURE - 500 GRAM", price: 100.00, category: "TATLI" },
    { id: ++currentProductId, name: "HÖŞMERİM - 500 GR", price: 100.00, category: "TATLI" },
    { id: ++currentProductId, name: "WAFFLE", price: 150.00, category: "TATLI" },
    { id: ++currentProductId, name: "DİĞER PASTA ÇEŞİTLERİ", price: 50.00, category: "TATLI" },
    { id: ++currentProductId, name: "KELLE PAÇA ÇORBA", price: 60.00, category: "ÇORBA" },
    { id: ++currentProductId, name: "TARHANA ÇORBA", price: 50.00, category: "ÇORBA" }
];
let nextProductId = currentProductId + 1;

let tables = [];
let nextTableIdCounter = 1;

function initializeTables() {
    tables = [];
    let currentId = 1;
    // Kamelya Masaları (6 adet)
    for (let i = 1; i <= 6; i++) {
        tables.push({ id: `masa-${currentId++}`, name: `KAMELYA ${i}`, type: 'kamelya', status: "boş", order: [], total: 0, waiterId: null, waiterUsername: null, kitchen_status: null, last_order_timestamp: 0 });
    }
    // Bahçe Masaları (16 adet)
    for (let i = 1; i <= 16; i++) {
        tables.push({ id: `masa-${currentId++}`, name: `BAHÇE ${i}`, type: 'bahce', status: "boş", order: [], total: 0, waiterId: null, waiterUsername: null, kitchen_status: null, last_order_timestamp: 0 });
    }
    // Özel Masalar (3 adet)
    const specialTableNames = ["AHMET EKMEKÇİ", "MEHMET EKMEKÇİ", "SÜLEYMAN EKMEKÇİ"];
    specialTableNames.forEach(name => {
        tables.push({ id: `masa-${currentId++}`, name: name, type: 'özel', status: "boş", order: [], total: 0, waiterId: null, waiterUsername: null, kitchen_status: null, last_order_timestamp: 0 });
    });
    // Toplam 25 masa olması için gerekirse ek masalar (örneğin 25 - (6+16+3) = 0, şu an tam 25)
    // Eğer KDS için daha fazla boş masa hücresi gerekiyorsa (örn: 7x4 grid = 28 hücre),
    // buraya göstermelik boş masa tanımları eklenebilir veya KDS tarafı boş hücreleri kendi oluşturabilir.
    // Şimdilik mevcut 25 masa tanımıyla devam ediyorum.
    nextTableIdCounter = currentId;
    console.log(`${tables.length} masa bellekte oluşturuldu.`);
}
initializeTables();

const clients = new Map();

function broadcast(message) {
    const messageString = JSON.stringify(message);
    clients.forEach((userInfo, clientSocket) => {
        if (clientSocket.readyState === WebSocket.OPEN) {
            try { clientSocket.send(messageString); } catch (error) { console.error(`Mesaj gönderilemedi (${userInfo ? userInfo.username : 'Bilinmeyen'}):`, error); clients.delete(clientSocket); }
        }
    });
}

function broadcastTableUpdates() {
    const tablesCopy = tables.map(t => ({...t, order: t.order.map(o => ({...o})) }));
    broadcast({ type: 'tables_update', payload: { tables: tablesCopy } });
}

function fetchProductsFromDB() { return products.slice(); }
async function broadcastProductsUpdate() { const currentProducts = fetchProductsFromDB(); broadcast({ type: 'products_update', payload: { products: currentProducts } });}
function broadcastWaitersList(requestingWs) { const waiters = users.filter(u => u.role === 'waiter').map(u => ({ id: u.id, username: u.username })); const messagePayload = { type: 'waiters_list', payload: { waiters: waiters } }; if (requestingWs && requestingWs.readyState === WebSocket.OPEN) { requestingWs.send(JSON.stringify(messagePayload)); } else { clients.forEach((userInfo, clientSocket) => { if (userInfo && userInfo.role === 'cashier' && clientSocket.readyState === WebSocket.OPEN) { try { clientSocket.send(JSON.stringify(messagePayload)); } catch (e) { console.error("Garson listesi gönderilemedi:", e); } } }); } }
function calculateTableTotal(order) { return order.reduce((sum, item) => { const price = parseFloat(item.priceAtOrder) || 0; const quantity = parseInt(item.quantity, 10) || 0; return sum + (price * quantity); }, 0); }
function getClientIp(ws, req) { try { const forwardedFor = req?.headers['x-forwarded-for']; if (forwardedFor) { return forwardedFor.split(',')[0].trim(); } return ws._socket?.remoteAddress || req?.socket?.remoteAddress || null; } catch (e) { console.warn("IP adresi alınırken hata:", e); return null; } }
async function logActivity(username, actionType, details = {}, targetEntity = null, targetEntityId = null, ipAddress = null) { const clientDB = await pool.connect(); try { await clientDB.query( `INSERT INTO activity_log (user_username, action_type, target_entity, target_entity_id, log_details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)`, [username || 'SISTEM', actionType, targetEntity, targetEntityId ? String(targetEntityId) : null, JSON.stringify(details), ipAddress] ); console.log(`Aktivite Loglandı: [${actionType}] Kullanıcı: ${username || 'SISTEM'}, Detay: ${JSON.stringify(details)}`); } catch (error) { console.error('!!! Aktivite Loglama Hatası !!!:', error.stack); } finally { clientDB.release(); } }

wss.on('connection', (ws, req) => {
    const clientIpAddress = getClientIp(ws, req);
    console.log(`Yeni bir istemci bağlandı. IP: ${clientIpAddress || 'Bilinmiyor'}`);

    ws.on('message', async (messageAsString) => {
        let message;
        try { message = JSON.parse(messageAsString); } catch (e) { console.error('Geçersiz JSON formatı:', messageAsString, e); ws.send(JSON.stringify({ type: 'error', payload: { message: 'Geçersiz JSON formatı.' } })); return; }

        const { type, payload } = message;
        let currentUserInfo = clients.get(ws);
        // console.log(`Alınan mesaj tipi: ${type}, Kullanıcı: ${currentUserInfo?.username || 'Bilinmiyor'}`); // Detaylı log için

        switch (type) {
            case 'login':
                const userToLogin = users.find(u => u.username === payload.username && u.password === payload.password);
                if (userToLogin) {
                    for (let [client, info] of clients.entries()) {
                        if (info.id === userToLogin.id && client !== ws) { client.terminate(); clients.delete(client); }
                    }
                    clients.set(ws, { id: userToLogin.id, username: userToLogin.username, role: userToLogin.role, ip: clientIpAddress });
                    currentUserInfo = clients.get(ws);
                    const memProductsLogin = fetchProductsFromDB();
                    ws.send(JSON.stringify({ type: 'login_success', payload: { user: currentUserInfo, tables: tables, products: memProductsLogin }}));
                    await logActivity(userToLogin.username, 'KULLANICI_GIRIS', { rol: userToLogin.role }, 'User', userToLogin.id, clientIpAddress);
                } else {
                    ws.send(JSON.stringify({ type: 'login_fail', payload: { error: 'Kullanıcı adı veya şifre hatalı.' } }));
                    await logActivity(payload.username, 'KULLANICI_GIRIS_BASARISIZ', { sebep: 'Hatalı şifre/kullanıcı adı' }, 'User', null, clientIpAddress);
                }
                break;

            case 'reauthenticate':
                 if (payload && payload.user && payload.user.id) {
                     const foundUser = users.find(u => u.id === payload.user.id && u.username === payload.user.username);
                     if (foundUser) {
                         for (let [client, info] of clients.entries()) { if (info.id === foundUser.id && client !== ws) { client.terminate(); clients.delete(client); } }
                         clients.set(ws, { ...payload.user, ip: clientIpAddress });
                         currentUserInfo = clients.get(ws);
                         ws.send(JSON.stringify({ type: 'tables_update', payload: { tables: tables } }));
                         ws.send(JSON.stringify({ type: 'products_update', payload: { products: fetchProductsFromDB() } }));
                     } else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Geçersiz oturum bilgisi.' } }));}
                 } else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Eksik oturum bilgisi.' } }));}
                break;

            case 'get_products':
                try { ws.send(JSON.stringify({ type: 'products_update', payload: { products: fetchProductsFromDB() } })); } catch (err) { console.error('Ürünler alınırken hata:', err); ws.send(JSON.stringify({ type: 'error', payload: { message: 'Ürünler getirilemedi.' } })); }
                break;

            case 'get_users':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                ws.send(JSON.stringify({ type: 'users_list', payload: { users: users.map(u => ({id: u.id, username: u.username, role: u.role})) } }));
                break;

            case 'add_order_item':
                if (!currentUserInfo) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Giriş yapmalısınız.' } })); return; }
                const tableToAdd = tables.find(t => t.id === payload.tableId);
                const productInfo = products.find(p => p.id === parseInt(payload.productId));

                if (tableToAdd && productInfo && typeof payload.quantity === 'number' && payload.quantity > 0) {
                    const kds_item_unique_id = 'kds_item_' + Date.now() + '_' + Math.random().toString(16).slice(2);
                    const newOrderItemData = {
                        kds_item_id: kds_item_unique_id,
                        productId: productInfo.id,
                        name: payload.nameOverwrite || productInfo.name,
                        category: productInfo.category,
                        quantity: payload.quantity,
                        priceAtOrder: payload.priceAtOrderOverwrite !== null && payload.priceAtOrderOverwrite !== undefined ? payload.priceAtOrderOverwrite : productInfo.price,
                        description: payload.description || '',
                        waiterUsername: currentUserInfo.username,
                        timestamp: Date.now(),
                        isKgSale: payload.isKgSale || false,
                        grams: payload.grams || null,
                        kds_status_mutfak: 'new'
                    };

                    const existingItem = tableToAdd.order.find(item =>
                        item.productId === productInfo.id &&
                        item.description === newOrderItemData.description &&
                        !payload.isKgSale &&
                        item.priceAtOrder === productInfo.price
                    );

                    if (existingItem && !payload.isKgSale) {
                        existingItem.quantity += newOrderItemData.quantity;
                        existingItem.timestamp = newOrderItemData.timestamp;
                        existingItem.waiterUsername = newOrderItemData.waiterUsername;
                        existingItem.kds_status_mutfak = 'new'; // Tekrar mutfağa bildir
                        existingItem.kds_item_id = kds_item_unique_id; // ID'yi güncelle ki KDS doğru item'ı bulsun
                    } else {
                        tableToAdd.order.push(newOrderItemData);
                    }

                    tableToAdd.total = calculateTableTotal(tableToAdd.order);
                    tableToAdd.status = 'dolu';
                    if (!tableToAdd.waiterId || currentUserInfo.role === 'waiter') {
                        tableToAdd.waiterId = currentUserInfo.id;
                        tableToAdd.waiterUsername = currentUserInfo.username;
                    }
                    tableToAdd.last_order_timestamp = Date.now();
                    tableToAdd.kitchen_status = 'new_order';

                    broadcastTableUpdates();
                    await logActivity(currentUserInfo.username, 'SIPARIS_URUN_EKLENDI',
                         { masa: tableToAdd.name, urun_id: productInfo.id, urun_adi: newOrderItemData.name, adet: newOrderItemData.quantity, fiyat: newOrderItemData.priceAtOrder, aciklama: newOrderItemData.description, gram: newOrderItemData.grams },
                         'Order', tableToAdd.id, clientIpAddress);
                } else { ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Geçersiz masa, ürün veya adet.' } })); }
                break;

            case 'add_manual_order_item':
                 if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                const tableForManual = tables.find(t => t.id === payload.tableId);
                if (tableForManual && payload.name && typeof payload.price === 'number' && payload.price >= 0 && typeof payload.quantity === 'number' && payload.quantity > 0) {
                     const manualItemData = {
                         kds_item_id: 'kds_item_' + Date.now() + '_' + Math.random().toString(16).slice(2),
                         productId: null, name: payload.name, category: payload.category || 'Diğer', quantity: payload.quantity,
                         priceAtOrder: payload.price, description: payload.description || '',
                         waiterUsername: currentUserInfo.username, timestamp: Date.now(),
                         isKgSale: false, grams: null, kds_status_mutfak: 'new'
                     };
                    tableForManual.order.push(manualItemData);
                    tableForManual.total = calculateTableTotal(tableForManual.order);
                    tableForManual.status = 'dolu';
                    if (!tableForManual.waiterId) { tableForManual.waiterId = currentUserInfo.id; tableForManual.waiterUsername = currentUserInfo.username; }
                    tableForManual.last_order_timestamp = Date.now();
                    tableForManual.kitchen_status = 'new_order';
                    broadcastTableUpdates();
                    await logActivity(currentUserInfo.username, 'SIPARIS_MANUEL_URUN_EKLENDI',
                        { masa: tableForManual.name, urun_adi: payload.name, adet: payload.quantity, fiyat: payload.price, kategori: payload.category || 'Diğer', aciklama: payload.description || '' },
                        'Order', tableForManual.id, clientIpAddress);
                } else { ws.send(JSON.stringify({ type: 'manual_order_update_fail', payload: { error: 'Geçersiz manuel ürün bilgileri.' } }));}
                break;

            case 'remove_order_item':
                if (!currentUserInfo) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Giriş yapmalısınız.' } })); return; }
                const tableToRemoveFrom = tables.find(t => t.id === payload.tableId);
                if (tableToRemoveFrom && payload.kds_item_id_to_remove) { // kds_item_id ile silme
                    const itemIndex = tableToRemoveFrom.order.findIndex(item => item.kds_item_id === payload.kds_item_id_to_remove);
                    if (itemIndex > -1) {
                        const removedItemDetails = { ...tableToRemoveFrom.order[itemIndex] };
                        tableToRemoveFrom.order.splice(itemIndex, 1);
                        tableToRemoveFrom.total = calculateTableTotal(tableToRemoveFrom.order);
                        if (tableToRemoveFrom.order.length === 0) {
                            tableToRemoveFrom.status = 'boş'; tableToRemoveFrom.waiterId = null; tableToRemoveFrom.waiterUsername = null; tableToRemoveFrom.kitchen_status = null; tableToRemoveFrom.last_order_timestamp = 0;
                        } else {
                            const hasNew = tableToRemoveFrom.order.some(it => it.kds_status_mutfak === 'new');
                            const hasPreparing = tableToRemoveFrom.order.some(it => it.kds_status_mutfak === 'preparing');
                            const hasReady = tableToRemoveFrom.order.some(it => it.kds_status_mutfak === 'ready');
                            if (hasReady) tableToRemoveFrom.kitchen_status = 'ready';
                            else if (hasPreparing) tableToRemoveFrom.kitchen_status = 'preparing';
                            else if (hasNew) tableToRemoveFrom.kitchen_status = 'new_order';
                            else tableToRemoveFrom.kitchen_status = 'acknowledged';
                        }
                        broadcastTableUpdates();
                        await logActivity(currentUserInfo.username, 'SIPARIS_URUN_SILINDI', { masa: tableToRemoveFrom.name, silinen_urun: removedItemDetails }, 'Order', tableToRemoveFrom.id, currentUserInfo.ip);
                    } else { ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Öğe (ID ile) bulunamadı.' } })); }
                } else if (tableToRemoveFrom) { // Eski silme mantığı (fallback, eğer kds_item_id gelmezse)
                    const productIdNum = (payload.productId === null || payload.productId === 'manual') ? null : parseInt(payload.productId, 10);
                    const itemIndex = tableToRemoveFrom.order.findIndex(item => { /* ... önceki fallback eşleşme mantığı ... */ return false; }); // Bu fallback'i daha dikkatli ele almak gerekebilir
                    // ...
                } else { ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Masa bulunamadı.' } })); }
                break;

            case 'close_table':
                // ... (Aynı)
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } })); return; }
                const tableToClose = tables.find(t => t.id === payload.tableId);
                if (tableToClose && tableToClose.order && tableToClose.order.length > 0) {
                    const closingTime = new Date();
                    // ... (loglama ve db işlemleri aynı) ...
                    const clientDB = await pool.connect();
                    try {
                        await clientDB.query('BEGIN');
                        for (const item of tableToClose.order) { /* ... */ await clientDB.query(/* ... */); }
                        await clientDB.query('COMMIT');
                        await logActivity(/* ... */);
                        tableToClose.order = []; tableToClose.total = 0; tableToClose.status = 'boş';
                        tableToClose.waiterId = null; tableToClose.waiterUsername = null;
                        tableToClose.kitchen_status = null; tableToClose.last_order_timestamp = 0;
                        broadcastTableUpdates();
                    } catch (error) { await clientDB.query('ROLLBACK'); /* ... */ } finally { clientDB.release(); }
                } else if (tableToClose && (!tableToClose.order || tableToClose.order.length === 0)) {
                     ws.send(JSON.stringify({ type: 'error', payload: { message: 'Boş masa kapatılamaz.' } }));
                } else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Kapatılacak masa bulunamadı.' } }));}
                break;

            case 'complete_quick_sale':
                // ... (Aynı, musteri_adi loglaması zaten ekliydi)
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
                    const quickSaleTimestamp = new Date(); const processedByQuickSale = payload.cashierUsername || currentUserInfo.username; const customerName = payload.customerName || null;
                    const clientQuickSaleDB = await pool.connect();
                    try { /* ... DB işlemleri ve loglama ... */ await logActivity(currentUserInfo.username, 'HIZLI_SATIS_TAMAMLANDI', { urunler: payload.items, /* ... */ musteri_adi: customerName }, 'QuickSale', null, clientIpAddress);
                    } catch (error) { /* ... */ } finally { clientQuickSaleDB.release(); }
                } else { ws.send(JSON.stringify({ type: 'quick_sale_fail', payload: { error: 'Hızlı satış için ürün bulunamadı.' } }));}
                break;

            case 'get_sales_report':
                // ... (Aynı)
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Rapor görüntüleme yetkiniz yok.' } })); return; }
                try { const reportResult = await pool.query( `SELECT id, item_name, item_price, quantity, total_item_price, category, description, waiter_username, table_name, TO_CHAR(sale_timestamp, 'DD.MM.YYYY HH24:MI:SS') as sale_timestamp FROM sales_log ORDER BY sale_timestamp DESC LIMIT 500` ); ws.send(JSON.stringify({ type: 'sales_report_data', payload: { sales: reportResult.rows } }));
                } catch (error) { console.error("Satış raporu alınırken hata:", error); ws.send(JSON.stringify({ type: 'error', payload: { message: 'Rapor alınırken bir veritabanı sorunu oluştu.' } })); }
                break;
            case 'get_activity_log':
                // ... (Aynı)
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Log görüntüleme yetkiniz yok.' } })); return; }
                try { const logResult = await pool.query( `SELECT log_id, user_username, action_type, log_details, TO_CHAR(log_timestamp, 'DD.MM.YYYY HH24:MI:SS') as log_timestamp_formatted FROM activity_log ORDER BY log_timestamp DESC LIMIT 200` ); const logsForClient = logResult.rows.map(log => ({ log_id: log.log_id, user_username: log.user_username, action_type: log.action_type, log_details: log.log_details, log_timestamp: log.log_timestamp_formatted })); ws.send(JSON.stringify({ type: 'activity_log_data', payload: { logs: logsForClient } }));
                } catch (error) { console.error("Aktivite logları alınırken hata:", error); ws.send(JSON.stringify({ type: 'error', payload: { message: 'Loglar alınırken bir veritabanı sorunu oluştu.' } })); }
                break;
            // ... (add_product_to_main_menu, update_main_menu_product, add_table, edit_table_name, delete_table, get_waiters_list, add_waiter, edit_waiter_password, delete_waiter aynı)

            case 'get_initial_kds_orders':
                if (currentUserInfo && currentUserInfo.role === 'kitchen') {
                    const activeOrdersForKDS = tables
                        .filter(t => t.status === 'dolu' && t.order && t.order.length > 0 && t.order.some(item => item.kds_status_mutfak !== 'delivered_to_customer'))
                        .map(t => ({
                            id: t.id, name: t.name, waiterUsername: t.waiterUsername,
                            order: t.order.filter(item => item.kds_status_mutfak !== 'delivered_to_customer').map(item => ({ ...item })), // Sadece mutfağı ilgilendiren itemlar
                            kitchen_status: t.kitchen_status, last_order_timestamp: t.last_order_timestamp
                        }));
                    ws.send(JSON.stringify({ type: 'kds_initial_orders', payload: { activeOrders: activeOrdersForKDS, allTables: tables.map(t => ({id: t.id, name: t.name, type: t.type})) } }));
                }
                break;

            case 'kds_item_status_change':
                if (currentUserInfo && currentUserInfo.role === 'kitchen' && payload && payload.tableId && payload.kds_item_id && payload.newStatus) {
                    const table = tables.find(t => t.id === payload.tableId);
                    if (table && table.order) {
                        const itemInOrder = table.order.find(item => item.kds_item_id === payload.kds_item_id);
                        if (itemInOrder) itemInOrder.kds_status_mutfak = payload.newStatus;

                        const hasNew = table.order.some(it => it.kds_status_mutfak === 'new');
                        const hasPreparing = table.order.some(it => it.kds_status_mutfak === 'preparing');
                        const allReadyOrDelivered = table.order.every(it => it.kds_status_mutfak === 'ready' || it.kds_status_mutfak === 'delivered_to_customer');
                        const hasAnyReady = table.order.some(it => it.kds_status_mutfak === 'ready');

                        if (allReadyOrDelivered && hasAnyReady) table.kitchen_status = 'ready';
                        else if (hasPreparing) table.kitchen_status = 'preparing';
                        else if (hasNew) table.kitchen_status = 'new_order';
                        else if (table.order.every(it => it.kds_status_mutfak === 'delivered_to_customer')) table.kitchen_status = 'acknowledged'; // Hepsi teslim edilmişse
                        else table.kitchen_status = 'acknowledged'; // Veya sipariş yoksa

                        broadcastTableUpdates();
                    }
                }
                break;

            case 'kds_table_status_change':
                 if (currentUserInfo && currentUserInfo.role === 'kitchen' && payload && payload.tableId && payload.newStatusForAllItems) {
                    const table = tables.find(t => t.id === payload.tableId);
                    if (table && table.order) {
                        table.order.forEach(item => {
                            if (item.kds_status_mutfak !== 'delivered_to_customer' && item.kds_status_mutfak !== 'ready') { // Sadece 'new' veya 'preparing' olanları güncelle
                                item.kds_status_mutfak = payload.newStatusForAllItems;
                            }
                        });
                        if (payload.newStatusForAllItems === 'ready') {
                             if (table.order.every(it => it.kds_status_mutfak === 'ready' || it.kds_status_mutfak === 'delivered_to_customer')) {
                                table.kitchen_status = 'ready';
                             } else if (table.order.some(it => it.kds_status_mutfak === 'preparing')) {
                                table.kitchen_status = 'preparing';
                             } else if (table.order.some(it => it.kds_status_mutfak === 'new')) {
                                table.kitchen_status = 'new_order';
                             }
                        } else if (payload.newStatusForAllItems === 'preparing') {
                            table.kitchen_status = 'preparing';
                        }
                        broadcastTableUpdates();
                    }
                 }
                break;

            case 'acknowledge_order_ready':
                if ((currentUserInfo.role === 'cashier' || currentUserInfo.role === 'waiter') && payload && payload.tableId) {
                    const table = tables.find(t => t.id === payload.tableId);
                    if (table) {
                        table.kitchen_status = 'acknowledged';
                        if (table.order) {
                            table.order.forEach(item => {
                                if (item.kds_status_mutfak === 'ready') { item.kds_status_mutfak = 'delivered_to_customer'; }
                            });
                        }
                        broadcastTableUpdates();
                    }
                }
                break;

            case 'logout':
                if (currentUserInfo) {
                    await logActivity(currentUserInfo.username, 'KULLANICI_CIKIS', {}, 'User', currentUserInfo.id, currentUserInfo.ip);
                    clients.delete(ws); console.log(`Kullanıcı çıkış yaptı: ${currentUserInfo.username}`);
                }
                break;

            default:
                console.log('Bilinmeyen mesaj tipi (default):', type, "Payload:", payload);
                ws.send(JSON.stringify({ type: 'error', payload: { message: `Bilinmeyen mesaj tipi: ${type}` } }));
        }
    });

    ws.on('close', async () => { const closedUser = clients.get(ws); if (closedUser) { console.log(`İstemci bağlantısı kesildi: ${closedUser.username}`); } else { console.log(`Kimliği doğrulanmamış istemci bağlantısı kesildi.`); } clients.delete(ws); });
    ws.on('error', (error) => { console.error('WebSocket hatası:', error); clients.delete(ws); });
});

httpServer.listen(HTTP_PORT, () => { console.log(`EMET LEZZET GÜNLERİ ADİSYON SİSTEMİ ${HTTP_PORT} portunda dinlemede.`); });
process.on('SIGINT', async () => { console.log('Sunucu kapatılıyor...'); if (pool) await pool.end(); console.log('PostgreSQL bağlantısı kapatıldı.'); process.exit(0); });
process.on('SIGTERM', async () => { console.log('Sunucu kapatılıyor...'); if (pool) await pool.end(); console.log('PostgreSQL bağlantısı kapatıldı.'); process.exit(0); });
