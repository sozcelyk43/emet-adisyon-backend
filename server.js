// server.js
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');
const { Pool } = require('pg');

// --- Sunucu Ayarları ---
const HTTP_PORT = process.env.PORT || 8080;

// --- PostgreSQL Veritabanı Bağlantısı ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.connect()
    .then(() => console.log('PostgreSQL veritabanına başarıyla bağlandı! (sales_log ve activity_log için)'))
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

// --- Sunucu Verileri ---
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
];

let currentProductId = 1000;
let products = [
    { id: ++currentProductId, name: "KELLE PAÇA ÇORBA", price: 60.00, category: "ÇORBA" },
    { id: ++currentProductId, name: "TARHANA ÇORBA", price: 50.00, category: "ÇORBA" },
    { id: ++currentProductId, name: "YAPRAK DÖNER - KG", price: 1800.00, category: "ET - TAVUK", isByWeight: true, unitPrice: 1.80 },
    { id: ++currentProductId, name: "YAPRAK D. EKMEK ARASI", price: 200.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "YAPRAK D. PORS.", price: 250.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "ET DÖNER EKMEK ARASI", price: 150.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "ET DÖNER PORSİYON", price: 175.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "TAVUK DÖNER EKMEK ARASI", price: 130.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "TAVUK DÖNER PORSİYON", price: 150.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "KÖFTE - KG", price: 800.00, category: "ET - TAVUK", isByWeight: true, unitPrice: 0.80 },
    { id: ++currentProductId, name: "KÖFTE EKMEK", price: 130.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "KÖFTE PORSİYON", price: 150.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "KUZU ŞİŞ", price: 150.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "ADANA ŞİŞ", price: 150.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "PİRZOLA - 4 ADET", price: 250.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "TAVUK FAJİTA", price: 200.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "TAVUK (PİLİÇ) ÇEVİRME", price: 250.00, category: "ET - TAVUK" },
    { id: ++currentProductId, name: "ET DÖNER - KG", price: 1300.00, category: "ET - TAVUK", isByWeight: true, unitPrice: 1.30 },
    { id: ++currentProductId, name: "TAVUK DÖNER - KG", price: 800.00, category: "ET - TAVUK", isByWeight: true, unitPrice: 0.80 },
    { id: ++currentProductId, name: "AYVALIK TOSTU", price: 120.00, category: "ATIŞTIRMALIK" },
    { id: ++currentProductId, name: "HAMBURGER", price: 150.00, category: "ATIŞTIRMALIK" },
    { id: ++currentProductId, name: "PİDE ÇEŞİTLERİ", price: 120.00, category: "ATIŞTIRMALIK" },
    { id: ++currentProductId, name: "PİZZA KARIŞIK (ORTA BOY)", price: 150.00, category: "ATIŞTIRMALIK" },
    { id: ++currentProductId, name: "PİZZA KARIŞIK (BÜYÜK BOY)", price: 200.00, category: "ATIŞTIRMALIK" },
    { id: ++currentProductId, name: "LAHMACUN", price: 75.00, category: "ATIŞTIRMALIK" },
    { id: ++currentProductId, name: "ÇİĞ KÖFTE KG (MARUL-LİMON)", price: 300.00, category: "ATIŞTIRMALIK", isByWeight: true, unitPrice: 0.30 },
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
    { id: ++currentProductId, name: "TROPİKAL - KARPUZELLA", price: 75.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "TROPİKAL - NAR-I ŞAHANE", price: 75.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "TROPİKAL - MAVİ TURUNÇ", price: 75.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "TROPİKAL - ELMA RÜYASI", price: 75.00, category: "İÇECEK" },
    { id: ++currentProductId, name: "EV BAKLAVASI - KG", price: 400.00, category: "TATLI", isByWeight: true, unitPrice: 0.40 },
    { id: ++currentProductId, name: "EV BAKLAVASI - PORSİYON", price: 75.00, category: "TATLI" },
    { id: ++currentProductId, name: "AŞURE - 500 GRAM", price: 100.00, category: "TATLI" },
    { id: ++currentProductId, name: "HÖŞMERİM - 500 GR", price: 100.00, category: "TATLI" },
    { id: ++currentProductId, name: "WAFFLE", price: 150.00, category: "TATLI" },
    { id: ++currentProductId, name: "DİĞER PASTA ÇEŞİTLERİ", price: 50.00, category: "TATLI" }
];
let nextProductId = currentProductId + 1;

let tables = [];
let nextTableIdCounter = 1;

function initializeTables() {
    tables = [];
    let currentId = 1;
    for (let i = 1; i <= 6; i++) {
        tables.push({ id: `masa-${currentId++}`, name: `KAMELYA ${i}`, type: 'kamelya', status: "boş", order: [], total: 0, waiterId: null, waiterUsername: null });
    }
    for (let i = 1; i <= 16; i++) {
        tables.push({ id: `masa-${currentId++}`, name: `BAHÇE ${i}`, type: 'bahce', status: "boş", order: [], total: 0, waiterId: null, waiterUsername: null });
    }
    const specialTableNames = ["AHMET EKMEKÇİ", "MEHMET EKMEKÇİ", "SÜLEYMAN EKMEKÇİ"];
    specialTableNames.forEach(name => {
        tables.push({ id: `masa-${currentId++}`, name: name, type: 'özel', status: "boş", order: [], total: 0, waiterId: null, waiterUsername: null });
    });
    nextTableIdCounter = currentId;
    console.log(`${tables.length} masa bellekte oluşturuldu.`);
}
initializeTables();

const clients = new Map();

// --- Yardımcı Fonksiyonlar ---
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

function fetchProductsFromDB() {
    console.log("Bellekten ürünler çekiliyor (tanımlandığı sırayla).");
    return products.slice();
}

async function broadcastProductsUpdate() {
    const currentProducts = fetchProductsFromDB();
    broadcast({ type: 'products_update', payload: { products: currentProducts } });
}

function getActiveUsernames() {
    return Array.from(clients.values()).map(userInfo => userInfo.username);
}

function broadcastActiveUsersList() {
    const activeUsernames = getActiveUsernames();
    const allUsersForStatus = users.map(u => ({ username: u.username, role: u.role }));
    broadcast({ type: 'active_users_update', payload: { activeUsernames, allUsers: allUsersForStatus } });
    console.log("Aktif kullanıcı listesi yayınlandı:", activeUsernames);
}

function broadcastWaitersList(requestingWs) {
    const waiters = users.filter(u => u.role === 'waiter').map(u => ({ id: u.id, username: u.username }));
    const messagePayload = { type: 'waiters_list', payload: { waiters: waiters } };
    if (requestingWs && requestingWs.readyState === WebSocket.OPEN) {
        requestingWs.send(JSON.stringify(messagePayload));
    } else {
        clients.forEach((userInfo, clientSocket) => {
            if (userInfo && userInfo.role === 'cashier' && clientSocket.readyState === WebSocket.OPEN) {
                try { clientSocket.send(JSON.stringify(messagePayload)); } catch (e) { console.error("Garson listesi gönderilemedi:", e); }
            }
        });
    }
}

function calculateTableTotal(order) {
    return order.reduce((sum, item) => {
        const itemPrice = parseFloat(item.priceAtOrder) || 0;
        if (item.isCustomItem || item.isByWeightEntry) {
            return sum + itemPrice;
        } else {
            const itemQuantity = parseInt(item.quantity, 10) || 0;
            return sum + (itemPrice * itemQuantity);
        }
    }, 0);
}

function getClientIp(ws, req) {
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
    try {
        const clientDB = await pool.connect();
        try {
            await clientDB.query(
                `INSERT INTO activity_log (user_username, action_type, target_entity, target_entity_id, log_details, ip_address)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    username || 'SISTEM', actionType, targetEntity,
                    targetEntityId ? String(targetEntityId) : null, JSON.stringify(details), ipAddress
                ]
            );
            console.log(`Aktivite Loglandı: [${actionType}] Kullanıcı: ${username || 'SISTEM'}, Detay: ${JSON.stringify(details)}`);
        } catch (error) {
            if (error.message.includes("relation \"activity_log\" does not exist")) {
                console.warn('!!! Aktivite Loglama Hatası: "activity_log" tablosu bulunamadı. Loglama devre dışı. !!!');
            } else {
                console.error('!!! Aktivite Loglama Hatası (Veritabanı) !!!:', error.stack);
            }
        } finally {
            clientDB.release();
        }
    } catch (dbConnectError) {
         console.error('!!! Aktivite Loglama Hatası (Veritabanı Bağlantısı) !!!:', dbConnectError.stack);
    }
}

// --- Ana WebSocket Olay İşleyicisi ---
wss.on('connection', (ws, req) => {
    const clientIpAddress = getClientIp(ws, req);
    console.log(`Yeni bir istemci bağlandı. IP: ${clientIpAddress || 'Bilinmiyor'}`);
    const activeUsernamesOnConnect = getActiveUsernames();
    const allUsersForStatusOnConnect = users.map(u => ({ username: u.username, role: u.role }));
    ws.send(JSON.stringify({ type: 'all_users_and_active_status_data', payload: { allUsers: allUsersForStatusOnConnect, activeUsernames: activeUsernamesOnConnect } }));


    ws.on('message', async (messageAsString) => {
        let message;
        try {
            message = JSON.parse(messageAsString);
            console.log(`Alınan mesaj tipi: ${message.type}, Kullanıcı: ${clients.get(ws)?.username || 'Bilinmiyor'}`);
        } catch (e) {
            console.error('Geçersiz JSON formatı:', messageAsString, e);
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Geçersiz JSON formatı.' } }));
            return;
        }

        const { type, payload } = message;
        let currentUserInfo = clients.get(ws);

        const isHamzaRestricted = currentUserInfo && currentUserInfo.username === 'hamza';
        const allowedActionsForHamza = ['login', 'reauthenticate', 'get_all_users_and_active_status', 'get_products', 'complete_quick_sale', 'logout'];

        if (isHamzaRestricted && !allowedActionsForHamza.includes(type)) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok (hamza).' } }));
            return;
        }

        switch (type) {
            case 'login':
                const user = users.find(u => u.username === payload.username && u.password === payload.password);
                if (user) {
                    for (let [client, info] of clients.entries()) {
                        if (info.id === user.id && client !== ws) {
                            console.log(`Mevcut bağlantı sonlandırılıyor (ID: ${user.id}, Kullanıcı: ${info.username})`);
                            client.send(JSON.stringify({ type: 'force_logout', payload: { message: 'Bu hesap başka bir yerden giriş yaptı.' } }));
                            client.terminate();
                            clients.delete(client);
                        }
                    }
                    clients.set(ws, { id: user.id, username: user.username, role: user.role, ip: clientIpAddress });
                    currentUserInfo = clients.get(ws);
                    const memProductsLogin = fetchProductsFromDB();
                    ws.send(JSON.stringify({ type: 'login_success', payload: { user: currentUserInfo, tables: tables, products: memProductsLogin }}));
                    console.log(`Kullanıcı giriş yaptı: ${user.username} (Rol: ${user.role}, IP: ${clientIpAddress})`);
                    await logActivity(user.username, 'KULLANICI_GIRIS', { rol: user.role }, 'User', user.id, clientIpAddress);
                    broadcastActiveUsersList();
                } else {
                    ws.send(JSON.stringify({ type: 'login_fail', payload: { error: 'Kullanıcı adı veya şifre hatalı.' } }));
                    await logActivity(payload.username, 'KULLANICI_GIRIS_BASARISIZ', { sebep: 'Hatalı şifre/kullanıcı adı' }, 'User', null, clientIpAddress);
                }
                break;

            case 'reauthenticate':
                 if (payload && payload.user && payload.user.id) {
                     const foundUser = users.find(u => u.id === payload.user.id && u.username === payload.user.username);
                     if (foundUser) {
                         let oldClientTerminatedReauth = false;
                         for (let [client, info] of clients.entries()) {
                             if (info.id === foundUser.id && client !== ws) {
                                 client.send(JSON.stringify({ type: 'force_logout', payload: { message: 'Bu hesap başka bir yerden giriş yaptı (reauth).' } }));
                                 client.terminate(); clients.delete(client);
                                 oldClientTerminatedReauth = true;
                             }
                         }
                         clients.set(ws, { ...payload.user, ip: clientIpAddress });
                         currentUserInfo = clients.get(ws);
                         const memProductsReauth = fetchProductsFromDB();
                         ws.send(JSON.stringify({ type: 'reauth_success', payload: { user: currentUserInfo } }));
                         ws.send(JSON.stringify({ type: 'tables_update', payload: { tables: tables } }));
                         ws.send(JSON.stringify({ type: 'products_update', payload: { products: memProductsReauth } }));
                         console.log(`Kullanıcı oturumu sürdürdü: ${currentUserInfo.username} (IP: ${currentUserInfo.ip})`);
                         if(oldClientTerminatedReauth) broadcastActiveUsersList();
                     } else {
                         ws.send(JSON.stringify({ type: 'error', payload: { message: 'Geçersiz oturum bilgisi. Lütfen tekrar giriş yapın.' } }));
                     }
                 } else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Eksik oturum bilgisi.' } }));}
                break;

            case 'get_all_users_and_active_status':
                const activeUsernames = getActiveUsernames();
                const allUsersForStatus = users.map(u => ({ username: u.username, role: u.role }));
                ws.send(JSON.stringify({ type: 'all_users_and_active_status_data', payload: { allUsers: allUsersForStatus, activeUsernames: activeUsernames } }));
                break;

            case 'get_products':
                try {
                    const memProducts = fetchProductsFromDB();
                    ws.send(JSON.stringify({ type: 'products_update', payload: { products: memProducts } }));
                } catch (err) {
                    console.error('Ürünler (get_products) alınırken beklenmedik hata:', err);
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Ürünler getirilemedi.' } }));
                }
                break;

            case 'get_users':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier' || isHamzaRestricted) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return;
                }
                ws.send(JSON.stringify({ type: 'users_list', payload: { users: users.map(u => ({id: u.id, username: u.username, role: u.role})) } }));
                break;
            
            case 'add_order_item':
                if (!currentUserInfo || isHamzaRestricted) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } })); return; }
                const tableToAdd = tables.find(t => t.id === payload.tableId);
                const receivedProductId = payload.isCustomItem ? (payload.originalProductId || null) : parseInt(payload.productId, 10);
                let productToAddDetails;
                const currentProductsList = fetchProductsFromDB();
                if (payload.isCustomItem) {
                    productToAddDetails = {
                        id: receivedProductId, name: payload.name, price: payload.priceAtOrder, 
                        category: payload.category, isByWeight: !!payload.isByWeightEntry 
                    };
                } else { 
                    if (isNaN(receivedProductId)) { ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Geçersiz ürün IDsi.' } })); return; }
                    productToAddDetails = currentProductsList.find(p => p.id === receivedProductId);
                }
                if (tableToAdd && productToAddDetails && typeof payload.quantity === 'number' && payload.quantity > 0) {
                    const orderItem = {
                        productId: productToAddDetails.id, name: productToAddDetails.name, category: productToAddDetails.category,
                        quantity: payload.quantity, priceAtOrder: productToAddDetails.price, description: payload.description || '',
                        waiterUsername: currentUserInfo.username, timestamp: Date.now(),
                        isCustomItem: !!payload.isCustomItem, isByWeightEntry: !!payload.isByWeightEntry,
                        originalProductId: payload.isCustomItem ? payload.originalProductId : null
                    };
                    let existingItemIndex = -1;
                    if (!orderItem.isCustomItem && !orderItem.isByWeightEntry) {
                        existingItemIndex = tableToAdd.order.findIndex(item =>
                            item.productId === orderItem.productId && item.description === orderItem.description &&
                            !item.isCustomItem && !item.isByWeightEntry);
                    }
                    if (existingItemIndex > -1) {
                        tableToAdd.order[existingItemIndex].quantity += orderItem.quantity;
                        tableToAdd.order[existingItemIndex].waiterUsername = currentUserInfo.username; 
                        tableToAdd.order[existingItemIndex].timestamp = Date.now(); 
                    } else {
                        tableToAdd.order.push(orderItem);
                    }
                    tableToAdd.total = calculateTableTotal(tableToAdd.order);
                    tableToAdd.status = 'dolu';
                    tableToAdd.waiterId = currentUserInfo.id; tableToAdd.waiterUsername = currentUserInfo.username;
                    broadcastTableUpdates();
                     await logActivity(currentUserInfo.username, 'SIPARIS_URUN_EKLENDI',
                         { masa: tableToAdd.name, urun_detayi: orderItem },
                         'Order', tableToAdd.id, currentUserInfo.ip);
                } else { ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Geçersiz masa, ürün veya adet.' } })); }
                break;

            case 'add_manual_order_item':
                 if (!currentUserInfo || currentUserInfo.role !== 'cashier' || isHamzaRestricted) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                const tableForManual = tables.find(t => t.id === payload.tableId);
                if (tableForManual && payload.name && typeof payload.price === 'number' && payload.price >= 0 && typeof payload.quantity === 'number' && payload.quantity > 0) {
                    const manualOrderItem = {
                         productId: null, name: payload.name, category: payload.category || 'Diğer', quantity: payload.quantity,
                         priceAtOrder: payload.price, description: payload.description || '',
                         waiterUsername: currentUserInfo.username, timestamp: Date.now(),
                         isCustomItem: true, isByWeightEntry: false 
                     };
                    tableForManual.order.push(manualOrderItem);
                    tableForManual.total = calculateTableTotal(tableForManual.order);
                    tableForManual.status = 'dolu';
                    tableForManual.waiterId = currentUserInfo.id; tableForManual.waiterUsername = currentUserInfo.username;
                    broadcastTableUpdates();
                    await logActivity(currentUserInfo.username, 'SIPARIS_MANUEL_URUN_EKLENDI',
                        { masa: tableForManual.name, urun_detayi: manualOrderItem },
                        'Order', tableForManual.id, currentUserInfo.ip);
                } else { ws.send(JSON.stringify({ type: 'manual_order_update_fail', payload: { error: 'Geçersiz manuel ürün bilgileri.' } }));}
                break;

            case 'remove_order_item':
                 if (!currentUserInfo) { 
                     ws.send(JSON.stringify({ type: 'error', payload: { message: 'Giriş yapmalısınız.' } })); 
                     return; 
                 }
                 const isHamzaRestrictedServerRemove = currentUserInfo && currentUserInfo.username === 'hamza';
                 if (isHamzaRestrictedServerRemove) { // Hamza bu işlemi yapamaz (hızlı satış hariç)
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok (hamza).' } }));
                    return;
                 }
                
                const tableToRemoveFrom = tables.find(t => t.id === payload.tableId);
                if (tableToRemoveFrom) {
                    const pNameFromPayload = payload.name;    // İstemciden gelen tam ürün adı (örn: "ET DÖNER - KG (250 gr)")
                    const pDescriptionFromPayload = payload.description === undefined ? '' : payload.description;
                    let removedItemDetails = null;

                    console.log(`[SERVER remove_order_item] Silme isteği: tableId='${payload.tableId}', name='${pNameFromPayload}', desc='${pDescriptionFromPayload}'`);
                    
                    const itemIndex = tableToRemoveFrom.order.findIndex(item => {
                        const itemDesc = item.description || '';
                        // Eşleşme için ürünün tam adını ve açıklamasını kullan
                        const match = item.name === pNameFromPayload && itemDesc === pDescriptionFromPayload;
                        
                        if (match) {
                            removedItemDetails = { ...item };
                        }
                        return match;
                    });

                    if (itemIndex > -1) {
                        tableToRemoveFrom.order.splice(itemIndex, 1);
                        tableToRemoveFrom.total = calculateTableTotal(tableToRemoveFrom.order);
                        if (tableToRemoveFrom.order.length === 0) {
                            tableToRemoveFrom.status = 'boş'; 
                            tableToRemoveFrom.waiterId = null; 
                            tableToRemoveFrom.waiterUsername = null;
                        }
                        broadcastTableUpdates();
                        if (removedItemDetails && currentUserInfo) {
                            await logActivity(currentUserInfo.username, 'SIPARIS_URUN_SILINDI',
                                { masa: tableToRemoveFrom.name, silinen_urun: removedItemDetails },
                                'Order', 
                                tableToRemoveFrom.id, 
                                currentUserInfo.ip
                            );
                        }
                        console.log("[SERVER remove_order_item] Öğe başarıyla silindi.");
                        // Başarı mesajı gönderilebilir (opsiyonel)
                        // ws.send(JSON.stringify({ type: 'order_item_removed_success', payload: { message: 'Öğe siparişten silindi.'} }));
                    } else { 
                        console.log("[SERVER remove_order_item] Silinecek öğe bulunamadı. İsim ve açıklama eşleşmedi.");
                        ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Silinecek öğe bulunamadı. Açıklama ve ürün adı eşleşmiyor olabilir.' } }));
                    }
                } else { 
                    ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Masa bulunamadı.' } }));
                }
                break;

            case 'close_table':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier' || isHamzaRestricted) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } })); return; }
                const tableToClose = tables.find(t => t.id === payload.tableId);
                if (tableToClose && tableToClose.order && tableToClose.order.length > 0) {
                    const closingTime = new Date();
                    const tableName = tableToClose.name;
                    const processedBy = tableToClose.waiterUsername || currentUserInfo.username;
                    const orderDetailsForLog = { ...tableToClose }; 
                    const clientDB = await pool.connect();
                    try {
                        await clientDB.query('BEGIN');
                        for (const item of tableToClose.order) {
                            let itemPriceForLog = parseFloat(item.priceAtOrder) || 0;
                            let quantityForLog = parseInt(item.quantity, 10) || 0; 
                            let totalItemPriceForLog = itemPriceForLog * quantityForLog;
                            if (item.isCustomItem || item.isByWeightEntry) { 
                                totalItemPriceForLog = itemPriceForLog; 
                                const originalProduct = products.find(p=>p.id === item.originalProductId);
                                if (originalProduct && originalProduct.unitPrice) {
                                    itemPriceForLog = originalProduct.unitPrice; 
                                } else if (item.isCustomItem && !item.isByWeightEntry) { 
                                     itemPriceForLog = quantityForLog !== 0 ? item.priceAtOrder / quantityForLog : item.priceAtOrder; 
                                     if (isNaN(itemPriceForLog) || !isFinite(itemPriceForLog)) itemPriceForLog = item.priceAtOrder;
                                }
                            }
                            await clientDB.query(
                                `INSERT INTO sales_log (item_name, item_price, quantity, total_item_price, category, description, waiter_username, table_name, sale_timestamp)
                                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                                [ item.name || 'Bilinmeyen Ürün', itemPriceForLog, quantityForLog, 
                                  totalItemPriceForLog, item.category || 'Diğer', item.description || null,
                                  item.waiterUsername || processedBy, tableName, closingTime ]
                            );
                        }
                        await clientDB.query('COMMIT');
                        console.log(`${tableName} masasındaki satışlar sales_log'a kaydedildi.`);
                        await logActivity(currentUserInfo.username, 'MASA_KAPATILDI_HESAP_ALINDI',
                            { masa_adi: tableName, siparis_detaylari: orderDetailsForLog.order, toplam_tutar: orderDetailsForLog.total, islem_yapan: processedBy },
                            'Table', payload.tableId, currentUserInfo.ip);
                        tableToClose.order = []; tableToClose.total = 0; tableToClose.status = 'boş';
                        tableToClose.waiterId = null; tableToClose.waiterUsername = null;
                        broadcastTableUpdates();
                    } catch (error) {
                        await clientDB.query('ROLLBACK');
                        console.error(`Satış logu kaydedilirken DB hatası (Masa: ${tableName}):`, error);
                        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Satışlar kaydedilirken bir veritabanı sorunu oluştu.' } }));
                    } finally { clientDB.release(); }
                } else if (tableToClose && (!tableToClose.order || tableToClose.order.length === 0)) {
                     ws.send(JSON.stringify({ type: 'error', payload: { message: 'Boş masa kapatılamaz.' } }));
                } else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Kapatılacak masa bulunamadı.' } }));}
                break;

            case 'complete_quick_sale':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
                    const quickSaleTimestamp = new Date();
                    const processedByQuickSale = payload.cashierUsername || currentUserInfo.username;
                    const customerNameForLog = payload.customerName || null; 
                    const clientQuickSaleDB = await pool.connect();
                    try {
                        await clientQuickSaleDB.query('BEGIN');
                        const currentProductsListQuickSale = fetchProductsFromDB();
                        let totalQuickSaleAmount = 0;
                        for (const item of payload.items) {
                            let itemPrice = parseFloat(item.priceAtOrder) || 0; 
                            let itemQuantity = parseInt(item.quantity, 10) || 0; 
                            let totalItemPrice = itemPrice * itemQuantity;
                            if (item.isCustomItem || item.isByWeightEntry) { 
                                totalItemPrice = itemPrice;
                            }
                            totalQuickSaleAmount += totalItemPrice;
                            const productDetails = currentProductsListQuickSale.find(p => p.id === item.originalProductId || p.id === item.productId);
                            const category = item.category || (productDetails ? productDetails.category : 'Hızlı Satış');
                            let unitPriceForLog = item.priceAtOrder; 
                            if ((item.isCustomItem || item.isByWeightEntry) && item.originalProductId && productDetails && productDetails.unitPrice) {
                                unitPriceForLog = productDetails.unitPrice; 
                            } else if (item.isCustomItem && !item.isByWeightEntry && itemQuantity !== 0) { 
                                unitPriceForLog = item.priceAtOrder / itemQuantity;
                                if(isNaN(unitPriceForLog) || !isFinite(unitPriceForLog)) unitPriceForLog = item.priceAtOrder;
                            }

                            await clientQuickSaleDB.query(
                                `INSERT INTO sales_log (item_name, item_price, quantity, total_item_price, category, description, waiter_username, table_name, sale_timestamp, customer_name)
                                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                                [ item.name || (productDetails ? productDetails.name : 'Bilinmeyen Ürün'),
                                  unitPriceForLog, itemQuantity, totalItemPrice, category, 
                                  item.description || null, processedByQuickSale, 'Hızlı Satış', 
                                  quickSaleTimestamp, customerNameForLog ]
                            );
                        }
                        await clientQuickSaleDB.query('COMMIT');
                        console.log(`${currentUserInfo.username} tarafından hızlı satış tamamlandı ve sales_log'a kaydedildi.`);
                        ws.send(JSON.stringify({ type: 'quick_sale_success', payload: { message: 'Hızlı satış tamamlandı.'} }));
                        await logActivity(currentUserInfo.username, 'HIZLI_SATIS_TAMAMLANDI',
                            { urunler: payload.items, toplam_tutar: totalQuickSaleAmount, islem_yapan: processedByQuickSale, musteri_adi: customerNameForLog,
                              orijinal_tutar: payload.originalTotal, indirim_tutari: payload.discountAmount, odenecek_tutar: payload.finalTotal },
                            'QuickSale', null, currentUserInfo.ip);
                    } catch (error) {
                        await clientQuickSaleDB.query('ROLLBACK');
                        console.error(`Hızlı satış logu kaydedilirken DB hatası:`, error);
                        ws.send(JSON.stringify({ type: 'quick_sale_fail', payload: { error: 'Hızlı satış kaydedilirken bir sorun oluştu.' } }));
                    } finally { clientQuickSaleDB.release(); }
                } else { ws.send(JSON.stringify({ type: 'quick_sale_fail', payload: { error: 'Hızlı satış için ürün bulunamadı.' } }));}
                break;

            case 'get_sales_report':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier' || isHamzaRestricted) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                try {
                    const reportResult = await pool.query(
                        `SELECT id, item_name, item_price, quantity, total_item_price, category, description,
                                waiter_username, table_name, TO_CHAR(sale_timestamp, 'DD.MM.YYYY HH24:MI:SS') as sale_timestamp, customer_name
                         FROM sales_log ORDER BY sale_timestamp DESC LIMIT 500`
                    );
                    ws.send(JSON.stringify({ type: 'sales_report_data', payload: { sales: reportResult.rows } }));
                } catch (error) { /* ... */ }
                break;

            case 'get_activity_log':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier' || isHamzaRestricted) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                try {
                    const logResult = await pool.query(
                        `SELECT log_id, user_username, action_type, log_details, 
                                TO_CHAR(log_timestamp, 'DD.MM.YYYY HH24:MI:SS') as log_timestamp_formatted
                         FROM activity_log ORDER BY log_timestamp DESC LIMIT 200`
                    );
                    const logsForClient = logResult.rows.map(log => ({
                        log_id: log.log_id, user_username: log.user_username, action_type: log.action_type,
                        log_details: log.log_details, log_timestamp: log.log_timestamp_formatted
                    }));
                    ws.send(JSON.stringify({ type: 'activity_log_data', payload: { logs: logsForClient } }));
                } catch (error) { /* ... */ }
                break;

            case 'add_product_to_main_menu':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier' || isHamzaRestricted) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.name && typeof payload.price === 'number' && payload.price >= 0 && payload.category) {
                    const newProduct = {
                        id: nextProductId++, name: payload.name.toUpperCase(), price: parseFloat(payload.price),
                        category: payload.category.toUpperCase(), isByWeight: payload.isByWeight || false,
                        unitPrice: payload.isByWeight ? (parseFloat(payload.unitPrice) || 0) : null
                    };
                    products.push(newProduct); 
                    await logActivity( currentUserInfo.username, 'URUN_EKLENDI_MENUYE (Bellek)',
                        { urun_id: newProduct.id, urun_adi: newProduct.name, fiyat: newProduct.price, kategori: newProduct.category, isByWeight: newProduct.isByWeight, unitPrice: newProduct.unitPrice },
                        'ProductInMemory', newProduct.id, currentUserInfo.ip );
                    await broadcastProductsUpdate(); 
                    ws.send(JSON.stringify({ type: 'main_menu_product_added', payload: { product: newProduct, message: `${newProduct.name} menüye eklendi.` } }));
                } else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Eksik ürün bilgisi.' } })); }
                break;

           case 'update_main_menu_product':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier' || isHamzaRestricted) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.id && payload.name && typeof payload.price === 'number' && payload.price >= 0 && payload.category) {
                    const productIndex = products.findIndex(p => p.id === parseInt(payload.id));
                    if (productIndex === -1) { /* ... */ return; }
                    const oldProduct = { ...products[productIndex] }; 
                    products[productIndex] = {
                        ...products[productIndex], name: payload.name.toUpperCase(), price: parseFloat(payload.price),
                        category: payload.category.toUpperCase(), isByWeight: payload.isByWeight || false,
                        unitPrice: payload.isByWeight ? (parseFloat(payload.unitPrice) || 0) : null
                    };
                    const updatedProduct = products[productIndex];
                    await logActivity( currentUserInfo.username, 'URUN_GUNCELLEME_MENU (Bellek)',
                        { urun_id: updatedProduct.id, urun_adi: updatedProduct.name,
                          eski_degerler: { name: oldProduct.name, price: oldProduct.price, category: oldProduct.category, isByWeight: oldProduct.isByWeight, unitPrice: oldProduct.unitPrice },
                          yeni_degerler: { name: updatedProduct.name, price: updatedProduct.price, category: updatedProduct.category, isByWeight: updatedProduct.isByWeight, unitPrice: updatedProduct.unitPrice } },
                        'ProductInMemory', updatedProduct.id, currentUserInfo.ip );
                    await broadcastProductsUpdate();
                    ws.send(JSON.stringify({ type: 'main_menu_product_updated', payload: { product: updatedProduct, message: `${updatedProduct.name} güncellendi.` } }));
                } else { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Eksik ürün bilgisi.' } }));}
                break;

            case 'add_table':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier' || isHamzaRestricted) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.name && payload.name.trim() !== "") {
                    const newTable = { id: `masa-${nextTableIdCounter++}`, name: payload.name.trim(), type: payload.type || 'bahce', status: "boş", order: [], total: 0, waiterId: null, waiterUsername: null };
                    tables.push(newTable); broadcastTableUpdates();
                    ws.send(JSON.stringify({ type: 'table_operation_success', payload: { message: `${newTable.name} eklendi.` } }));
                    await logActivity(currentUserInfo.username, 'MASA_TANIM_EKLENDI (Bellek)', { masa_adi: newTable.name, masa_tipi: newTable.type }, 'TableDefinition', newTable.id, currentUserInfo.ip);
                } else { ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Geçersiz masa adı.' } }));}
                break;
            case 'edit_table_name':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier' || isHamzaRestricted) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.tableId && payload.newName && payload.newName.trim() !== "") {
                    const tableToEdit = tables.find(t => t.id === payload.tableId);
                    if (tableToEdit) {
                        const oldName = tableToEdit.name;
                        tableToEdit.name = payload.newName.trim(); broadcastTableUpdates();
                        ws.send(JSON.stringify({ type: 'table_operation_success', payload: { message: `Masa adı ${tableToEdit.name} olarak güncellendi.` } }));
                        await logActivity(currentUserInfo.username, 'MASA_TANIM_ADI_GUNCELLEME (Bellek)', { masa_id: tableToEdit.id, eski_ad: oldName, yeni_ad: tableToEdit.name }, 'TableDefinition', tableToEdit.id, currentUserInfo.ip);
                    } else { ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Masa bulunamadı.' } }));}
                } else { ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Eksik bilgi.' } }));}
                break;
            case 'delete_table':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier' || isHamzaRestricted) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.tableId) {
                    const tableIndexToDelete = tables.findIndex(t => t.id === payload.tableId);
                    if (tableIndexToDelete > -1) {
                        if (tables[tableIndexToDelete].status === 'dolu' && tables[tableIndexToDelete].order.length > 0) {
                            ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: `"${tables[tableIndexToDelete].name}" dolu olduğu için silinemez.` } })); return;
                        }
                        const deletedTable = tables[tableIndexToDelete];
                        tables.splice(tableIndexToDelete, 1); broadcastTableUpdates();
                        ws.send(JSON.stringify({ type: 'table_operation_success', payload: { message: `"${deletedTable.name}" silindi.` } }));
                        await logActivity(currentUserInfo.username, 'MASA_TANIM_SILINDI (Bellek)', { masa_id: deletedTable.id, masa_adi: deletedTable.name }, 'TableDefinition', deletedTable.id, currentUserInfo.ip);
                    } else { ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Masa bulunamadı.' } }));}
                } else { ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Eksik masa IDsi.' } }));}
                break;
            case 'get_waiters_list':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier' || isHamzaRestricted) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                broadcastWaitersList(ws);
                break;
            case 'add_waiter':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier' || isHamzaRestricted) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.username && payload.password) {
                    if (users.find(u => u.username === payload.username)) { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Kullanıcı adı mevcut.' } })); return; }
                    const maxUserId = users.length > 0 ? users.reduce((max, u) => u.id > max ? u.id : max, 0) : 0;
                    const newWaiter = { id: maxUserId + 1, username: payload.username, password: payload.password, role: 'waiter' };
                    users.push(newWaiter); broadcastWaitersList();
                    ws.send(JSON.stringify({ type: 'waiter_operation_success', payload: { message: `${newWaiter.username} eklendi.` } }));
                    await logActivity(currentUserInfo.username, 'GARSON_EKLENDI (Bellek)', { garson_kullanici_adi: newWaiter.username }, 'User', newWaiter.id, currentUserInfo.ip);
                } else { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Eksik bilgi.' } }));}
                break;
            case 'edit_waiter_password':
                 if (!currentUserInfo || currentUserInfo.role !== 'cashier' || isHamzaRestricted) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.userId && payload.newPassword) {
                    const waiterToEdit = users.find(u => u.id === parseInt(payload.userId) && u.role === 'waiter');
                    if (waiterToEdit) {
                        waiterToEdit.password = payload.newPassword;
                        ws.send(JSON.stringify({ type: 'waiter_operation_success', payload: { message: `${waiterToEdit.username} şifresi güncellendi.` } }));
                        await logActivity(currentUserInfo.username, 'GARSON_SIFRE_GUNCELLEME (Bellek)', { garson_kullanici_adi: waiterToEdit.username }, 'User', waiterToEdit.id, currentUserInfo.ip);
                    } else { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Garson bulunamadı.' } }));}
                } else { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Eksik bilgi.' } }));}
                break;
            case 'delete_waiter':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier' || isHamzaRestricted) { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } })); return; }
                if (payload && payload.userId) {
                    const waiterIndexToDelete = users.findIndex(u => u.id === parseInt(payload.userId) && u.role === 'waiter');
                    if (waiterIndexToDelete > -1) {
                        const deletedWaiter = users[waiterIndexToDelete];
                        users.splice(waiterIndexToDelete, 1); broadcastWaitersList();
                        ws.send(JSON.stringify({ type: 'waiter_operation_success', payload: { message: `${deletedWaiter.username} silindi.` } }));
                        await logActivity(currentUserInfo.username, 'GARSON_SILINDI (Bellek)', { garson_kullanici_adi: deletedWaiter.username }, 'User', deletedWaiter.id, currentUserInfo.ip);
                    } else { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Garson bulunamadı.' } }));}
                } else { ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Eksik garson IDsi.' } }));}
                break;

            case 'logout':
                if (currentUserInfo) {
                    await logActivity(currentUserInfo.username, 'KULLANICI_CIKIS', {}, 'User', currentUserInfo.id, currentUserInfo.ip);
                    clients.delete(ws);
                    console.log(`Kullanıcı çıkış yaptı: ${currentUserInfo.username}`);
                    broadcastActiveUsersList();
                }
                break;

            default:
                console.log('Bilinmeyen mesaj tipi (default):', type, "Payload:", payload);
                ws.send(JSON.stringify({ type: 'error', payload: { message: `Bilinmeyen mesaj tipi sunucuda işlenemedi: ${type}` } }));
        }
    });

    ws.on('close', async () => {
        const closedUser = clients.get(ws);
        if (closedUser) {
            console.log(`İstemci bağlantısı kesildi: ${closedUser.username} (IP: ${closedUser.ip})`);
            clients.delete(ws);
            broadcastActiveUsersList();
        } else {
            console.log(`Kimliği doğrulanmamış bir istemcinin bağlantısı kesildi. (IP: ${clientIpAddress})`);
        }
    });

    ws.on('error', (error) => {
        console.error('Bir WebSocket hatası oluştu:', error);
        const erroredUser = clients.get(ws);
        if (erroredUser) {
            clients.delete(ws);
            broadcastActiveUsersList();
        }
    });
});

// --- HTTP Sunucusunu Başlatma ---
httpServer.listen(HTTP_PORT, () => {
  console.log(`EMET LEZZET GÜNLERİ ADİSYON SİSTEMİ ${HTTP_PORT} portunda dinlemede.`);
});

process.on('SIGINT', async () => {
    console.log('Sunucu kapatılıyor (SIGINT)...');
    if (pool) await pool.end();
    console.log('PostgreSQL bağlantısı kapatıldı.');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Sunucu kapatılıyor (SIGTERM)...');
    if (pool) await pool.end();
    console.log('PostgreSQL bağlantısı kapatıldı.');
    process.exit(0);
});
