// server.js
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');
const { Pool } = require('pg'); // PostgreSQL kütüphanesini import et

// --- Sunucu Ayarları ---
const HTTP_PORT = process.env.PORT || 8080;

// --- PostgreSQL Veritabanı Bağlantısı ---
// Render.com'daki Environment Variables'dan DATABASE_URL'i alacak.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.connect()
    .then(() => console.log('PostgreSQL veritabanına başarıyla bağlandı!'))
    .catch(err => {
        console.error('!!! VERİTABANI BAĞLANTI HATASI !!!:', err.stack);
        // Uygulamanın düzgün çalışmayacağını belirtmek için çıkış yapılabilir veya hata yönetimi genişletilebilir
        // process.exit(1); // Örneğin
    });

// --- Express Uygulaması ve HTTP Sunucusu ---
const app = express();
const httpServer = http.createServer(app);

// --- Statik Dosya Sunumu ('public' klasörü) ---
// Proje ana dizininizde 'public' klasörü oluşturup adisyon.html ve menu.html'i oraya taşıyın.
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

// --- WebSocket Sunucusunu HTTP Sunucusuna Bağlama ---
const wss = new WebSocket.Server({ server: httpServer });

console.log(`EMET LEZZET GÜNLERİ HTTP Sunucusu ${HTTP_PORT} portunda başlatıldı.`);
console.log(`WebSocket sunucusu da bu HTTP sunucusu üzerinden çalışıyor.`);

// --- Sunucu Verileri (Bellekteki diziler yerine artık DB'den anlık çekilecek veya DB'ye yazılacak) ---
// let users = []; // Artık DB'den gelecek
// let products = []; // Artık DB'den gelecek
// let tables = []; // Artık DB'den gelecek ve siparişleri de DB'den alacak
// let completedOrders = []; // Artık DB'den raporlanacak

// --- Yardımcı Fonksiyonlar (Örnekler) ---

async function getProductsFromDB() {
    try {
        const result = await pool.query('SELECT id, name, price, category FROM products ORDER BY category, name');
        return result.rows.map(p => ({ ...p, price: parseFloat(p.price) }));
    } catch (error) {
        console.error("DB'den ürünler alınırken hata:", error);
        return []; // Hata durumunda boş dizi dön
    }
}

async function getTablesFromDB() {
    try {
        const tablesResult = await pool.query('SELECT id, name, type, status FROM app_tables ORDER BY type, name');
        const tablesData = tablesResult.rows;

        // Her masa için açık siparişleri ve toplamı da çekebiliriz (daha karmaşık ama ideal)
        for (const table of tablesData) {
            const orderResult = await pool.query(
                `SELECT oi.id as item_id, oi.product_id, oi.name_at_order, oi.price_at_order, oi.quantity, oi.description, oi.waiter_username, oi.timestamp
                 FROM order_items oi
                 JOIN orders o ON oi.order_id = o.id
                 WHERE o.table_id = $1 AND o.status = 'açık'`,
                [table.id]
            );
            table.order = orderResult.rows.map(item => ({
                productId: item.product_id,
                name: item.name_at_order, // DB'den gelen doğru isim
                priceAtOrder: parseFloat(item.price_at_order),
                quantity: item.quantity,
                description: item.description,
                waiterUsername: item.waiter_username,
                timestamp: item.timestamp
            }));

            // Siparişin başındaki waiter bilgisini orders tablosundan alabiliriz
            const openOrderInfo = await pool.query(
                `SELECT u.username as waiter_username, u.id as waiter_id
                 FROM orders o
                 LEFT JOIN users u ON o.user_id = u.id
                 WHERE o.table_id = $1 AND o.status = 'açık'`,
                [table.id]
            );
            if (openOrderInfo.rows.length > 0) {
                table.waiterId = openOrderInfo.rows[0].waiter_id;
                table.waiterUsername = openOrderInfo.rows[0].waiter_username;
            } else {
                table.waiterId = null;
                table.waiterUsername = null;
            }

            table.total = table.order.reduce((sum, item) => sum + (item.priceAtOrder * item.quantity), 0);
        }
        return tablesData;
    } catch (error) {
        console.error("DB'den masalar alınırken hata:", error);
        return [];
    }
}


// --- WebSocket Yönetimi ---
const clients = new Map();

async function broadcastTableUpdates() {
    const currentTables = await getTablesFromDB();
    broadcast({ type: 'tables_update', payload: { tables: currentTables } });
}

async function broadcastProductsUpdate() {
    const currentProducts = await getProductsFromDB();
    broadcast({ type: 'products_update', payload: { products: currentProducts } });
}

async function broadcastWaitersList(requestingWs) {
    try {
        const result = await pool.query("SELECT id, username FROM users WHERE role = 'waiter' ORDER BY username");
        const waiters = result.rows;
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
    } catch (error) {
        console.error("Garson listesi DB'den alınırken hata:", error);
    }
}

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

// --- WebSocket Bağlantı Olayları ---
wss.on('connection', (ws) => {
    console.log('Yeni bir istemci bağlandı (WebSocket).');

    ws.on('message', async (messageAsString) => {
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
                try {
                    const result = await pool.query(
                        'SELECT id, username, role, password_hash FROM users WHERE username = $1',
                        [payload.username]
                    );
                    const user = result.rows[0];

                    if (user && await bcrypt.compare(payload.password, user.password_hash)) {
                        for (let [client, info] of clients.entries()) {
                            if (info.id === user.id && client !== ws) {
                                console.log(`Eski bağlantı kapatılıyor: ${info.username}`);
                                client.terminate();
                                clients.delete(client);
                            }
                        }
                        const userInfo = { id: user.id, username: user.username, role: user.role };
                        clients.set(ws, userInfo);
                        currentUserInfo = userInfo;

                        const initialProducts = await getProductsFromDB();
                        const initialTables = await getTablesFromDB();

                        ws.send(JSON.stringify({
                            type: 'login_success',
                            payload: {
                                user: userInfo,
                                tables: initialTables,
                                products: initialProducts
                            }
                        }));
                        console.log(`Kullanıcı giriş yaptı: ${user.username} (Rol: ${user.role})`);
                    } else {
                        ws.send(JSON.stringify({ type: 'login_fail', payload: { error: 'Kullanıcı adı veya şifre hatalı.' } }));
                    }
                } catch (error) {
                    console.error("Login sırasında DB hatası:", error);
                    ws.send(JSON.stringify({ type: 'login_fail', payload: { error: 'Giriş sırasında bir sorun oluştu.' } }));
                }
                break;

            case 'reauthenticate':
                console.log(`[reauthenticate] İstek alındı. Payload:`, payload);
                if (payload && payload.user && payload.user.id && payload.user.username && payload.user.role) {
                    try {
                        const result = await pool.query('SELECT id, username, role FROM users WHERE id = $1 AND username = $2', [payload.user.id, payload.user.username]);
                        const foundUser = result.rows[0];
                        if (foundUser) {
                            for (let [client, info] of clients.entries()) {
                                if (info.id === foundUser.id && client !== ws) {
                                    console.log(`Eski bağlantı kapatılıyor (reauth): ${info.username}`);
                                    client.terminate();
                                    clients.delete(client);
                                }
                            }
                            const userInfo = { id: foundUser.id, username: foundUser.username, role: foundUser.role };
                            clients.set(ws, userInfo);
                            currentUserInfo = userInfo;
                            console.log(`Kullanıcı oturumu sürdürdü: ${currentUserInfo.username}`);

                            const currentTables = await getTablesFromDB();
                            const currentProducts = await getProductsFromDB();

                            ws.send(JSON.stringify({ type: 'tables_update', payload: { tables: currentTables } }));
                            ws.send(JSON.stringify({ type: 'products_update', payload: { products: currentProducts } }));
                        } else {
                            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Geçersiz oturum bilgisi.' } }));
                        }
                    } catch (error) {
                        console.error("Reauthenticate sırasında DB hatası:", error);
                        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Oturum doğrulanırken bir sorun oluştu.' } }));
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Eksik oturum bilgisi.' } }));
                }
                break;

            case 'get_products': // Bu zaten 'login' ve 'reauthenticate' içinde gönderiliyor. İsteğe bağlı tutulabilir.
                try {
                    const currentProducts = await getProductsFromDB();
                    ws.send(JSON.stringify({ type: 'products_update', payload: { products: currentProducts } }));
                } catch (error) {
                    console.error("Ürünler DB'den alınırken hata:", error);
                }
                break;

            case 'add_product_to_main_menu':
                if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Bu işlem için yetkiniz yok.' } }));
                    return;
                }
                if (payload && payload.name && typeof payload.price === 'number' && payload.price >= 0 && payload.category) {
                    try {
                        const newProductData = {
                            name: payload.name.toUpperCase(),
                            price: parseFloat(payload.price),
                            category: payload.category.toUpperCase(),
                        };
                        const result = await pool.query(
                            'INSERT INTO products (name, price, category) VALUES ($1, $2, $3) RETURNING *',
                            [newProductData.name, newProductData.price, newProductData.category]
                        );
                        const newProduct = result.rows[0];
                        newProduct.price = parseFloat(newProduct.price); // Emin olmak için
                        console.log(`Yeni ürün ana menüye eklendi: ${newProduct.name}`);
                        await broadcastProductsUpdate(); // Tüm istemcilere güncel ürün listesini gönder
                        ws.send(JSON.stringify({ type: 'main_menu_product_added', payload: { product: newProduct, message: `${newProduct.name} menüye eklendi.` } }));
                    } catch (error) {
                        console.error('Menüye ürün eklenirken DB hatası:', error);
                        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Ürün eklenirken bir veritabanı hatası oluştu.' } }));
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Eksik veya geçersiz ürün bilgisi.' } }));
                }
                break;

            // --------------------------------------------------------------------------------- //
            // !!!! BURADAN SONRAKİ DİĞER TÜM CASE'LERİN (add_order_item, close_table vb.) !!!! //
            // !!!! BENZER ŞEKİLDE VERİTABANI SORGULARIYLA GÜNCELLENMESİ GEREKİR.           !!!! //
            // !!!! BU KAPSAMLI BİR İŞTİR VE HER BİR İŞLEM İÇİN AYRI AYRI YAPILMALIDIR.    !!!! //
            // --------------------------------------------------------------------------------- //

            // ÖRNEK: add_order_item (Kavramsal ve basitleştirilmiş, daha detaylı olmalı)
            case 'add_order_item':
                if (!currentUserInfo) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Sipariş eklemek için giriş yapmalısınız.' } }));
                    return;
                }
                const { tableId, productId, quantity, description } = payload;
                const receivedProductIdNum = parseInt(productId, 10);

                if (isNaN(receivedProductIdNum) || quantity <= 0 || !tableId) {
                    ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Geçersiz ürün IDsi, miktar veya masa IDsi.' } }));
                    return;
                }

                try {
                    await pool.query('BEGIN'); // Transaction başlat

                    // 1. Ürün bilgilerini al
                    const productResult = await pool.query('SELECT name, price FROM products WHERE id = $1', [receivedProductIdNum]);
                    if (productResult.rows.length === 0) {
                        await pool.query('ROLLBACK');
                        ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Ürün bulunamadı.' } }));
                        return;
                    }
                    const productInfo = productResult.rows[0];
                    const priceAtOrder = parseFloat(productInfo.price);
                    const nameAtOrder = productInfo.name;

                    // 2. Masanın açık bir siparişi var mı kontrol et, yoksa oluştur
                    let orderResult = await pool.query(
                        "SELECT id FROM orders WHERE table_id = $1 AND status = 'açık'",
                        [tableId]
                    );
                    let orderId;
                    if (orderResult.rows.length > 0) {
                        orderId = orderResult.rows[0].id;
                    } else {
                        const newOrder = await pool.query(
                            "INSERT INTO orders (table_id, user_id, status) VALUES ($1, $2, 'açık') RETURNING id",
                            [tableId, currentUserInfo.id] // tableId 'masa-X' formatında ise DB'deki integer ID'ye çevrilmeli.
                                                          // app_tables tablosundan SELECT id FROM app_tables WHERE name = $1 gibi
                        );
                        orderId = newOrder.rows[0].id;
                        // Masa durumunu 'dolu' yap
                        await pool.query("UPDATE app_tables SET status = 'dolu' WHERE id = $1", [tableId]); // Yine ID eşleşmesi önemli
                    }

                    // 3. Sipariş kalemini (order_items) ekle veya miktarını güncelle
                    // Bu kısım daha detaylı olmalı: Aynı ürün ve açıklama varsa miktar artırılabilir.
                    // Şimdilik her seferinde yeni kalem ekliyoruz (basitlik için)
                    await pool.query(
                        'INSERT INTO order_items (order_id, product_id, name_at_order, price_at_order, quantity, description, waiter_username, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())',
                        [orderId, receivedProductIdNum, nameAtOrder, priceAtOrder, quantity, description || '', currentUserInfo.username]
                    );

                    // 4. Sipariş (orders) toplamını güncelle
                    // Bu, bir trigger ile veya burada manuel olarak yapılabilir.
                    // const totalOrderAmountResult = await pool.query(
                    //    "SELECT SUM(price_at_order * quantity) as total FROM order_items WHERE order_id = $1",
                    //    [orderId]
                    // );
                    // const newTotal = totalOrderAmountResult.rows[0].total || 0;
                    // await pool.query("UPDATE orders SET total_amount = $1 WHERE id = $2", [newTotal, orderId]);


                    await pool.query('COMMIT'); // Transaction bitir
                    await broadcastTableUpdates(); // Tüm istemcilere güncel masa durumunu gönder

                } catch (error) {
                    await pool.query('ROLLBACK'); // Hata olursa geri al
                    console.error(`Sipariş eklenirken DB hatası (Masa ID: ${tableId}, Ürün ID: ${productId}):`, error);
                    ws.send(JSON.stringify({ type: 'order_update_fail', payload: { error: 'Sipariş eklenirken bir veritabanı sorunu oluştu.' } }));
                }
                break;


            // ... DİĞER TÜM CASE'LER BURAYA EKLENMELİ VE VERİTABANINA UYGUN HALE GETİRİLMELİ ...
            // add_manual_order_item, update_main_menu_product, add_table, edit_table_name,
            // delete_table, get_waiters_list, add_waiter, edit_waiter_password, delete_waiter,
            // complete_quick_sale, remove_order_item, close_table, get_sales_report

            case 'get_sales_report':
                 if (!currentUserInfo || currentUserInfo.role !== 'cashier') {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Yetkiniz yok.' } }));
                    return;
                }
                try {
                    const reportResult = await pool.query(
                        `SELECT
                            oi.id as item_id,
                            oi.name_at_order,
                            oi.quantity,
                            oi.price_at_order,
                            (oi.quantity * oi.price_at_order) as item_total,
                            oi.description as item_description,
                            oi.waiter_username as item_waiter,
                            oi.timestamp as item_add_time,
                            o.id as order_id,
                            o.status as order_status,
                            o.total_amount as order_total,
                            o.discount_amount as order_discount,
                            o.created_at as order_create_time,
                            o.closed_at as order_close_time,
                            COALESCE(tbl.name, 'Hızlı Satış') as table_name,
                            usr.username as order_processed_by
                         FROM order_items oi
                         JOIN orders o ON oi.order_id = o.id
                         LEFT JOIN app_tables tbl ON o.table_id = tbl.id
                         LEFT JOIN users usr ON o.user_id = usr.id
                         WHERE o.status = 'kapalı'
                         ORDER BY o.closed_at DESC, o.id DESC, oi.id ASC`
                    );
                    // Bu sorgu her bir kalemi ayrı satırda getirecektir. Rapor formatınıza göre gruplama gerekebilir.
                    ws.send(JSON.stringify({ type: 'sales_report_data', payload: { sales: reportResult.rows } }));
                } catch (error) {
                    console.error("Satış raporu DB'den alınırken hata:", error);
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Rapor alınırken bir sorun oluştu.' } }));
                }
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
    console.log(`Sunucu ${HTTP_PORT} portunda dinlemede.`);
});
