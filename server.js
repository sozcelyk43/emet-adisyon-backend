// server.js
const WebSocket = require('ws');
const express = require('express'); 
const http = require('http');     
const path = require('path');     

// --- Sunucu Ayarları ---
const HTTP_PORT = process.env.PORT || 8080; 

// --- Express Uygulaması ve HTTP Sunucusu ---
const app = express();
const httpServer = http.createServer(app); 

// --- Statik Dosya Sunumu ('public' klasörü) ---
app.use(express.static(path.join(__dirname, 'public')));

// Ana URL ('/') isteği geldiğinde adisyon.html dosyasını gönder
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

// /menu isteği geldiğinde menu.html dosyasını gönder
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
    { id: 1, username: 'onkasa', password: 'onkasa12', role: 'cashier' },
    { id: 2, username: 'arkakasa', password: 'arkakasa12', role: 'cashier' },
    { id: 3, username: 'omerfaruk', password: 'omer.faruk', role: 'waiter' },
    { id: 4, username: 'zeynel', password: 'zey.nel', role: 'waiter' },
    { id: 5, username: 'halil', password: 'ha.lil', role: 'waiter' },
    { id: 6, username: 'garson', password: 'gar.son', role: 'waiter' },
];

let products = [ 
    // ET - TAVUK Kategorisi
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
    { id: 1011, name: "TAVUK FAJİTA", price: 200.00, category: "ET - TAVUK" }, // Fiyat güncellendi
    { id: 1012, name: "TAVUK (PİLİÇ) ÇEVİRME", price: 250.00, category: "ET - TAVUK" },
    { id: 1013, name: "ET DÖNER - KG", price: 1300.00, category: "ET - TAVUK" },
    { id: 1014, name: "ET DÖNER - 500 GR", price: 650.00, category: "ET - TAVUK" },
    { id: 1015, name: "TAVUK DÖNER - KG", price: 800.00, category: "ET - TAVUK" },
    { id: 1016, name: "TAVUK DÖNER - 500 GR", price: 400.00, category: "ET - TAVUK" },
    // ATIŞTIRMALIK Kategorisi
    { id: 2001, name: "PİZZA KARIŞIK (ORTA BOY)", price: 150.00, category: "ATIŞTIRMALIK" },
    { id: 2002, name: "PİZZA KARIŞIK (BÜYÜK BOY)", price: 200.00, category: "ATIŞTIRMALIK" },
    { id: 2003, name: "LAHMACUN", price: 75.00, category: "ATIŞTIRMALIK" },
    { id: 2004, name: "PİDE ÇEŞİTLERİ", price: 100.00, category: "ATIŞTIRMALIK" },
    { id: 2005, name: "AYVALIK TOSTU", price: 100.00, category: "ATIŞTIRMALIK" },
    { id: 2006, name: "HAMBURGER", price: 120.00, category: "ATIŞTIRMALIK" },
    { id: 2007, name: "ÇİĞ KÖFTE KG (MARUL-LİMON)", price: 300.00, category: "ATIŞTIRMALIK" },
    // İÇECEK Kategorisi
    { id: 3001, name: "OSMANLI ŞERBETİ - 1 LİTRE", price: 75.00, category: "İÇECEK" },
    { id: 3002, name: "LİMONATA", price: 75.00, category: "İÇECEK" },
    { id: 3003, name: "SU", price: 10.00, category: "İÇECEK" },
    { id: 3004, name: "AYRAN", price: 15.00, category: "İÇECEK" },
    { id: 3005, name: "ÇAY", price: 10.00, category: "İÇECEK" },
    { id: 3006, name: "GAZOZ", price: 25.00, category: "İÇECEK" },
    // TATLI Kategorisi
    { id: 4001, name: "EV BAKLAVASI - KG", price: 400.00, category: "TATLI" },
    { id: 4002, name: "EV BAKLAVASI - 500 GRAM", price: 200.00, category: "TATLI" },
    { id: 4003, name: "EV BAKLAVASI - PORSİYON", price: 75.00, category: "TATLI" },
    { id: 4004, name: "AŞURE - 500 GRAM", price: 100.00, category: "TATLI" },
    { id: 4005, name: "HÖŞMERİM - 500 GRAM", price: 100.00, category: "TATLI" },
    { id: 4006, name: "DİĞER PASTA ÇEŞİTLERİ", price: 50.00, category: "TATLI" },
    { id: 4007, name: "YAĞLI GÖZLEME", price: 50.00, category: "TATLI" },
    { id: 4008, name: "İÇLİ GÖZLEME", price: 60.00, category: "TATLI" },
    // ÇORBA Kategorisi
    { id: 5001, name: "KELLE PAÇA ÇORBA", price: 60.00, category: "ÇORBA" },
    { id: 5002, name: "TARHANA ÇORBA", price: 60.00, category: "ÇORBA" }
];


let tables = []; 
let completedOrders = []; 
let nextTableIdCounter = 1; // Yeni masa ekleme için kullanılacak ID sayacı

function initializeTables() {
    tables = [];
    let currentId = 1; // Masa ID'lerini sıralı vermek için

    // Kamelya Masaları
    for (let i = 1; i <= 5; i++) {
        tables.push({
            id: `masa-${currentId++}`, 
            name: `Kamelya ${i}`,
            type: 'kamelya', 
            status: "boş", 
            order: [], 
            total: 0,
            waiterId: null, 
            waiterUsername: null 
        });
    }
    // Bahçe Masaları
    for (let i = 1; i <= 16; i++) {
        tables.push({
            id: `masa-${currentId++}`, 
            name: `Bahçe ${i}`,
            type: 'bahce', 
            status: "boş", 
            order: [], 
            total: 0,
            waiterId: null, 
            waiterUsername: null 
        });
    }
    nextTableIdCounter = currentId; // Bir sonraki eklenecek masa için ID'yi ayarla
    console.log(`${tables.length} masa oluşturuldu. Bir sonraki masa ID'si: ${nextTableIdCounter}`);
}
initializeTables(); 

// --- WebSocket Yönetimi ---
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
    if (requestingWs) { 
        requestingWs.send(JSON.stringify({ type: 'waiters_list', payload: { waiters: waiters } }));
    } else { 
        clients.forEach((userInfo, clientSocket) => {
            if (userInfo && userInfo.role === 'cashier' && clientSocket.readyState === WebSocket.OPEN) {
                clientSocket.send(JSON.stringify({ type: 'waiters_list', payload: { waiters: waiters } }));
            }
        });
    }
}


// Fiyatı hesaplamak için yardımcı fonksiyon
function calculateTableTotal(order) {
    return order.reduce((sum, item) => {
        const price = item.priceAtOrder || 0; 
        return sum + (price * item.quantity);
    }, 0);
}


wss.on('connection', (ws) => {
    console.log('Yeni bir istemci bağlandı (WebSocket).');

    ws.on('message', (messageAsString) => {
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
                            console.log(`Eski bağlantı kapatılıyor: ${info.username}`);
                            client.terminate(); 
                            clients.delete(client);
                        }
                    }
                    clients.set(ws, { id: user.id, username: user.username, role: user.role }); 
                    currentUserInfo = clients.get(ws); 
                    ws.send(JSON.stringify({
                        type: 'login_success',
                        payload: {
                            user: { id: user.id, username: user.username, role: user.role }, 
                            tables: tables, 
                            products: products 
                        }
                    }));
                    console.log(`Kullanıcı giriş yaptı: ${user.username} (Rol: ${user.role})`);
                } else {
                    ws.send(JSON.stringify({ type: 'login_fail', payload: { error: 'Kullanıcı adı veya şifre hatalı.' } }));
                }
                break;
            
            case 'reauthenticate':
                 console.log(`[reauthenticate] İstek alındı. Payload:`, payload);
                 if (payload && payload.user && payload.user.id && payload.user.username && payload.user.role) {
                     const foundUser = users.find(u => u.id === payload.user.id && u.username === payload.user.username);
                     if (foundUser) {
                         for (let [client, info] of clients.entries()) {
                             if (info.id === foundUser.id && client !== ws) {
                                 console.log(`Eski bağlantı kapatılıyor (reauth): ${info.username}`);
                                 client.terminate(); 
                                 clients.delete(client);
                             }
                         }
                         clients.set(ws, payload.user); 
                         currentUserInfo = payload.user; 
                         console.log(`Kullanıcı oturumu sürdürdü: ${currentUserInfo.username}`);
                         ws.send(JSON.stringify({ type: 'tables_update', payload: { tables: tables } }));
                         ws.send(JSON.stringify({ type: 'products_update', payload: { products: products } }));
                     } else {
                         console.log("[reauthenticate] Geçersiz kullanıcı bilgisi.");
                         ws.send(JSON.stringify({ type: 'error', payload: { message: 'Geçersiz oturum bilgisi.' } }));
                     }
                 } else {
                     console.log("[reauthenticate] Eksik kullanıcı bilgisi.");
                     ws.send(JSON.stringify({ type: 'error', payload: { message: 'Eksik oturum bilgisi.' } }));
                 }
                break;
            
            case 'get_products': 
                console.log("[get_products] İstek alındı, ürün listesi gönderiliyor.");
                ws.send(JSON.stringify({ type: 'products_update', payload: { products: products } }));
                break;

            case 'add_order_item':
                if (!currentUserInfo) { 
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Sipariş eklemek için giriş yapmalısınız.' } }));
                    return;
                }
                const tableToAdd = tables.find(t => t.id === payload.tableId);
                const receivedProductIdRaw = payload.productId;
                const receivedProductId = parseInt(receivedProductIdRaw, 10);

                if (isNaN(receivedProductId)) {
                     console.error(`[add_order_item] Geçersiz productId alındı: ${receivedProductIdRaw}`);
                     ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Geçersiz ürün IDsi.' } }));
                     return; 
                }
                
                const productToAdd = products.find(p => p.id === receivedProductId); 
                
                console.log(`[add_order_item] Ürün arama sonucu (productToAdd):`, productToAdd ? productToAdd.name : 'Bulunamadı'); 

                if (tableToAdd && productToAdd && payload.quantity > 0) {
                    const existingItem = tableToAdd.order.find(item => 
                        item.productId === receivedProductId && 
                        item.description === (payload.description || '')
                    ); 
                    
                    if (existingItem) {
                        existingItem.quantity += payload.quantity;
                        existingItem.waiterUsername = currentUserInfo.username; 
                        existingItem.timestamp = Date.now(); 
                    } else {
                        tableToAdd.order.push({
                            productId: receivedProductId, 
                            quantity: payload.quantity,
                            priceAtOrder: productToAdd.price, 
                            description: payload.description || '',
                            waiterUsername: currentUserInfo.username,
                            timestamp: Date.now() 
                        });
                    }
                    
                    tableToAdd.total = calculateTableTotal(tableToAdd.order); 
                    tableToAdd.status = 'dolu';
                    tableToAdd.waiterId = currentUserInfo.id; 
                    tableToAdd.waiterUsername = currentUserInfo.username; 

                    broadcastTableUpdates(); 
                } else {
                    console.error(`Sipariş eklenemedi: Masa=${!!tableToAdd}, Ürün=${!!productToAdd}, Adet=${payload.quantity}`);
                    ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Geçersiz masa, ürün veya adet.' } }));
                }
                break;

            case 'add_manual_order_item': 
                 if (!currentUserInfo) { 
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'İşlem için giriş yapmalısınız.' } }));
                    return;
                }
                 if (currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Manuel ürün ekleme yetkiniz yok.' } }));
                    return;
                }

                const tableForManual = tables.find(t => t.id === payload.tableId);
                
                if (tableForManual && payload.name && payload.price >= 0 && payload.quantity > 0) {
                     tableForManual.order.push({
                         name: payload.name, 
                         quantity: payload.quantity,
                         priceAtOrder: payload.price, 
                         description: payload.description || '',
                         category: payload.category || 'Diğer', 
                         waiterUsername: currentUserInfo.username,
                         timestamp: Date.now() 
                     });

                    tableForManual.total = calculateTableTotal(tableForManual.order);
                    tableForManual.status = 'dolu';
                    tableForManual.waiterId = currentUserInfo.id; 
                    tableForManual.waiterUsername = currentUserInfo.username; 
                    
                    broadcastTableUpdates();
                } else {
                     ws.send(JSON.stringify({ type: 'manual_order_update_fail', payload: { error: 'Geçersiz masa veya manuel ürün bilgileri.' } }));
                }
                break;
            
            case 'add_product_to_main_menu':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } }));
                    return;
                }
                if (payload && payload.name && payload.price >= 0 && payload.category) {
                    const maxId = products.reduce((max, p) => p.id > max ? p.id : max, 0);
                    const newProductId = maxId < 7000 ? 7001 : maxId + 1;

                    const newProduct = {
                        id: newProductId,
                        name: payload.name.toUpperCase(),
                        price: parseFloat(payload.price),
                        category: payload.category.toUpperCase(), 
                    };
                    products.push(newProduct);
                    console.log(`Yeni ürün ana menüye eklendi: ${newProduct.name}`);
                    broadcastProductsUpdate(); 
                    ws.send(JSON.stringify({ type: 'main_menu_product_added', payload: { product: newProduct, message: `${newProduct.name} menüye eklendi.` } })); 
                } else {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Eksik ürün bilgisi.' } }));
                }
                break;
            
            case 'update_main_menu_product':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } }));
                    return;
                }
                if (payload && payload.id && payload.name && payload.price >= 0 && payload.category) {
                    const productIndex = products.findIndex(p => p.id === parseInt(payload.id));
                    if (productIndex > -1) {
                        products[productIndex].name = payload.name.toUpperCase();
                        products[productIndex].price = parseFloat(payload.price);
                        products[productIndex].category = payload.category.toUpperCase();
                        console.log(`Ürün güncellendi: ID ${payload.id} - ${products[productIndex].name}`);
                        broadcastProductsUpdate();
                        ws.send(JSON.stringify({ type: 'main_menu_product_updated', payload: { product: products[productIndex], message: `${products[productIndex].name} güncellendi.` } }));
                    } else {
                        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Güncellenecek ürün bulunamadı.' } }));
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Eksik ürün bilgisi.' } }));
                }
                break;

            case 'add_table':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } }));
                    return;
                }
                if (payload && payload.name && payload.name.trim() !== "") {
                    const newTable = {
                        id: `masa-${nextTableIdCounter++}`, 
                        name: payload.name.trim(),
                        type: payload.type || 'bahce', // Varsayılan tip 'bahce' veya istemciden gelen
                        status: "boş",
                        order: [],
                        total: 0,
                        waiterId: null,
                        waiterUsername: null
                    };
                    tables.push(newTable);
                    console.log(`Yeni masa eklendi: ${newTable.name}`);
                    broadcastTableUpdates();
                    ws.send(JSON.stringify({ type: 'table_operation_success', payload: { message: `${newTable.name} eklendi.` } }));
                } else {
                    ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Geçersiz masa adı.' } }));
                }
                break;

            case 'edit_table_name':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } }));
                    return;
                }
                if (payload && payload.tableId && payload.newName && payload.newName.trim() !== "") {
                    const tableToEdit = tables.find(t => t.id === payload.tableId);
                    if (tableToEdit) {
                        tableToEdit.name = payload.newName.trim();
                        console.log(`Masa adı güncellendi: ${tableToEdit.id} -> ${tableToEdit.name}`);
                        broadcastTableUpdates();
                        ws.send(JSON.stringify({ type: 'table_operation_success', payload: { message: `Masa adı ${tableToEdit.name} olarak güncellendi.` } }));
                    } else {
                        ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Düzenlenecek masa bulunamadı.' } }));
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Eksik veya geçersiz bilgi.' } }));
                }
                break;

            case 'delete_table':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } }));
                    return;
                }
                if (payload && payload.tableId) {
                    const tableIndexToDelete = tables.findIndex(t => t.id === payload.tableId);
                    if (tableIndexToDelete > -1) {
                        const tableToDelete = tables[tableIndexToDelete];
                        if (tableToDelete.status === 'dolu' && tableToDelete.order.length > 0) {
                            ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: `"${tableToDelete.name}" dolu olduğu için silinemez. Önce hesabı kapatın.` } }));
                            return;
                        }
                        const deletedTableName = tableToDelete.name;
                        tables.splice(tableIndexToDelete, 1);
                        console.log(`Masa silindi: ${deletedTableName} (ID: ${payload.tableId})`);
                        broadcastTableUpdates();
                        ws.send(JSON.stringify({ type: 'table_operation_success', payload: { message: `"${deletedTableName}" başarıyla silindi.` } }));
                    } else {
                        ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Silinecek masa bulunamadı.' } }));
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'table_operation_fail', payload: { error: 'Eksik masa IDsi.' } }));
                }
                break;
            
            case 'get_waiters_list':
                if (currentUserInfo && currentUserInfo.role === 'cashier') {
                    broadcastWaitersList(ws); 
                } else {
                     ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } }));
                }
                break;

            case 'add_waiter':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } }));
                    return;
                }
                if (payload && payload.username && payload.password) {
                    if (users.find(u => u.username === payload.username)) {
                        ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Bu kullanıcı adı zaten mevcut.' } }));
                        return;
                    }
                    const maxUserId = users.reduce((max, u) => u.id > max ? u.id : max, 0);
                    const newWaiter = {
                        id: maxUserId + 1,
                        username: payload.username,
                        password: payload.password,
                        role: 'waiter'
                    };
                    users.push(newWaiter);
                    console.log(`Yeni garson eklendi: ${newWaiter.username}`);
                    broadcastWaitersList(); 
                    ws.send(JSON.stringify({ type: 'waiter_operation_success', payload: { message: `${newWaiter.username} adlı garson eklendi.` } }));
                } else {
                    ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Eksik garson bilgisi.' } }));
                }
                break;

            case 'edit_waiter_password':
                 if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } }));
                    return;
                }
                if (payload && payload.userId && payload.newPassword) {
                    const waiterToEdit = users.find(u => u.id === parseInt(payload.userId) && u.role === 'waiter');
                    if (waiterToEdit) {
                        waiterToEdit.password = payload.newPassword;
                        console.log(`Garson şifresi güncellendi: ${waiterToEdit.username}`);
                        ws.send(JSON.stringify({ type: 'waiter_operation_success', payload: { message: `${waiterToEdit.username} adlı garsonun şifresi güncellendi.` } }));
                    } else {
                        ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Düzenlenecek garson bulunamadı.' } }));
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Eksik bilgi.' } }));
                }
                break;

            case 'delete_waiter':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } }));
                    return;
                }
                if (payload && payload.userId) {
                    const waiterIndexToDelete = users.findIndex(u => u.id === parseInt(payload.userId) && u.role === 'waiter');
                    if (waiterIndexToDelete > -1) {
                        const deletedWaiterName = users[waiterIndexToDelete].username;
                        users.splice(waiterIndexToDelete, 1);
                        console.log(`Garson silindi: ${deletedWaiterName}`);
                        broadcastWaitersList(); 
                        ws.send(JSON.stringify({ type: 'waiter_operation_success', payload: { message: `${deletedWaiterName} adlı garson silindi.` } }));
                    } else {
                        ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Silinecek garson bulunamadı.' } }));
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'waiter_operation_fail', payload: { error: 'Eksik garson IDsi.' } }));
                }
                break;


            case 'complete_quick_sale':
                if (!currentUserInfo) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'İşlem için giriş yapmalısınız.' } }));
                    return;
                }
                if (currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Hızlı satış yapma yetkiniz yok.' } }));
                    return;
                }
                if (payload && payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
                    const quickSaleTimestamp = Date.now();
                    payload.items.forEach(item => {
                        completedOrders.push({
                            productId: item.productId, 
                            name: item.name, 
                            quantity: item.quantity,
                            priceAtOrder: item.priceAtOrder,
                            description: item.description || '',
                            category: products.find(p => p.id === item.productId)?.category || 'Hızlı Satış', 
                            waiterUsername: payload.cashierUsername, 
                            timestamp: item.timestamp || quickSaleTimestamp, 
                            tableName: 'Hızlı Satış', 
                            closingTimestamp: quickSaleTimestamp 
                        });
                    });
                    console.log(`${currentUserInfo.username} tarafından hızlı satış tamamlandı ve raporlandı.`);
                    ws.send(JSON.stringify({ type: 'quick_sale_success', payload: { message: 'Hızlı satış tamamlandı.'} }));
                } else {
                    ws.send(JSON.stringify({ type: 'quick_sale_fail', payload: { error: 'Hızlı satış için ürün bulunamadı.' } }));
                }
                break;


            case 'remove_order_item':
                 if (!currentUserInfo) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'İşlem için giriş yapmalısınız.' } }));
                    return;
                }
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
                            tableToRemoveFrom.status = 'boş';
                            tableToRemoveFrom.waiterId = null;
                            tableToRemoveFrom.waiterUsername = null; 
                        }
                        broadcastTableUpdates();
                    } else {
                        console.warn("Silinecek öğe bulunamadı:", payload);
                        ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Silinecek sipariş kalemi bulunamadı.' } }));
                    }
                } else {
                     ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Masa bulunamadı.' } }));
                }
                break;

            case 'close_table':
                if (!currentUserInfo) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'İşlem için giriş yapmalısınız.' } }));
                    return;
                }
                if (currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok (Sadece Kasa yapabilir).' } }));
                    return;
                }

                const tableToClose = tables.find(t => t.id === payload.tableId);
                if (tableToClose && tableToClose.order.length > 0) { 
                    const closingTime = Date.now(); 
                    
                    tableToClose.order.forEach(item => {
                        completedOrders.push({
                            ...item, 
                            tableName: tableToClose.name,
                            closingTimestamp: closingTime 
                        });
                    });
                    
                    tableToClose.order = [];
                    tableToClose.total = 0;
                    tableToClose.status = 'boş';
                    tableToClose.waiterId = null;
                    tableToClose.waiterUsername = null; 
                    console.log(`${currentUserInfo.username} tarafından ${tableToClose.name} kapatıldı ve raporlandı.`);
                    broadcastTableUpdates();
                } else if (tableToClose && tableToClose.order.length === 0) {
                     ws.send(JSON.stringify({ type: 'error', payload: { message: 'Boş masa kapatılamaz veya raporlanamaz.' } }));
                }
                 else {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Kapatılacak masa bulunamadı.' } }));
                }
                break;
            
            case 'get_sales_report':
                 console.log(`[get_sales_report] İstek alındı. İsteyen kullanıcı bilgisi (clients map'inden):`, currentUserInfo); 
                 if (!currentUserInfo) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'İşlem için giriş yapmalısınız.' } }));
                    return;
                }
                 if (currentUserInfo.role !== 'cashier') {
                     ws.send(JSON.stringify({ type: 'error', payload: { message: 'Rapor görüntüleme yetkiniz yok.' } }));
                    return;
                 }
                 ws.send(JSON.stringify({ type: 'sales_report_data', payload: { sales: completedOrders } }));
                 console.log(`${currentUserInfo.username} için satış raporu gönderildi.`);
                break;

            case 'logout':
                if (clients.has(ws)) {
                    const loggedOutUser = clients.get(ws);
                    clients.delete(ws);
                    console.log(`Kullanıcı çıkış yaptı: ${loggedOutUser.username}`);
                }
                break;

            default:
                console.log('Bilinmeyen mesaj tipi:', type);
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
  // Log mesajı zaten yukarıda tanımlı
});
