import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('cold_storage.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    phone TEXT,
    password TEXT,
    verified INTEGER DEFAULT 0,
    balance REAL DEFAULT 10000
  );

  CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER,
    role TEXT,
    PRIMARY KEY (user_id, role),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    price REAL,
    supplier_id INTEGER,
    category TEXT,
    FOREIGN KEY(supplier_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS inventory (
    product_id INTEGER PRIMARY KEY,
    quantity REAL DEFAULT 0,
    weight REAL DEFAULT 0,
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    supplier_id INTEGER,
    status TEXT DEFAULT 'pending',
    total_amount REAL,
    gst_amount REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES users(id),
    FOREIGN KEY(supplier_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity REAL,
    price REAL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS supply_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER,
    product_id INTEGER,
    quantity REAL,
    weight REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(supplier_id) REFERENCES users(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    role TEXT,
    message TEXT,
    type TEXT,
    order_id INTEGER,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed data
const seedUsers = [
  { username: 'admin', email: 'admin@frostflow.com', phone: '1234567890', password: 'password', role: 'inventory' },
  { username: 'supplier', email: 'supplier@frostflow.com', phone: '1234567891', password: 'password', role: 'supplier' },
  { username: 'customer', email: 'customer@frostflow.com', phone: '1234567892', password: 'password', role: 'customer' }
];

seedUsers.forEach(u => {
  const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(u.username);
  if (!existing) {
    const info = db.prepare('INSERT INTO users (username, email, phone, password, verified) VALUES (?, ?, ?, ?, 1)')
      .run(u.username, u.email, u.phone, u.password);
    db.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)').run(info.lastInsertRowid, u.role);
  }
});

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Endpoints
  app.post('/api/auth/register', (req, res) => {
    const { username, email, phone, password, role } = req.body;
    try {
      // Check if user already exists
      let user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(email, username);
      let userId;

      if (user) {
        // User exists, check password
        if (user.password !== password) {
          return res.status(400).json({ error: 'User exists with a different password' });
        }
        userId = user.id;
      } else {
        // Create new user
        const stmt = db.prepare('INSERT INTO users (username, email, phone, password) VALUES (?, ?, ?, ?)');
        const info = stmt.run(username, email, phone, password);
        userId = info.lastInsertRowid;
      }

      // Add role to user_roles (ignore if already exists)
      try {
        db.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)').run(userId, role);
      } catch (e) {
        // Role already associated with user, that's fine
      }

      res.json({ id: userId, status: 'otp_sent' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/verify-otp', (req, res) => {
    const { userId, otp } = req.body;
    // Mock OTP verification - in real app would check against stored OTP
    if (otp === '123456') {
      db.prepare('UPDATE users SET verified = 1 WHERE id = ?').run(userId);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid OTP' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { identifier, password, role } = req.body;
    
    // First check if user exists with correct password and role
    const user = db.prepare(`
      SELECT u.* FROM users u 
      JOIN user_roles ur ON u.id = ur.user_id 
      WHERE (u.username = ? OR u.email = ? OR u.phone = ?) 
      AND u.password = ? AND ur.role = ?
    `).get(identifier, identifier, identifier, password, role);
    
    if (user) {
      if (user.verified === 1) {
        res.json({ user: { id: user.id, username: user.username, email: user.email, role: role, balance: user.balance } });
      } else {
        res.status(401).json({ error: 'Account not verified. Please verify your OTP.' });
      }
    } else {
      res.status(401).json({ error: 'Invalid credentials or role' });
    }
  });

  app.get('/api/suppliers', (req, res) => {
    const suppliers = db.prepare(`
      SELECT u.id, u.username, u.email, 
      (SELECT COUNT(*) FROM products WHERE supplier_id = u.id) as product_count
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role = 'supplier'
    `).all();
    res.json(suppliers);
  });

  app.get('/api/users/:id', (req, res) => {
    const user = db.prepare('SELECT id, username, email, balance FROM users WHERE id = ?').get(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });

  // Notification Endpoints
  app.get('/api/notifications/:userId', (req, res) => {
    const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.params.userId);
    res.json(notifications);
  });

  app.post('/api/notifications/read', (req, res) => {
    const { userId } = req.body;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
    res.json({ success: true });
  });

  // Product Endpoints
  app.get('/api/products', (req, res) => {
    const products = db.prepare(`
      SELECT p.*, u.username as supplier_name, i.quantity as stock 
      FROM products p 
      JOIN users u ON p.supplier_id = u.id 
      LEFT JOIN inventory i ON p.id = i.product_id
    `).all();
    res.json(products);
  });

  app.post('/api/products', (req, res) => {
    const { name, description, price, supplier_id, category, quantity = 0, weight = 0 } = req.body;
    const stmt = db.prepare('INSERT INTO products (name, description, price, supplier_id, category) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(name, description, price, supplier_id, category);
    // Initialize inventory for this product
    db.prepare('INSERT INTO inventory (product_id, quantity, weight) VALUES (?, ?, ?)').run(info.lastInsertRowid, quantity, weight);
    res.json({ id: info.lastInsertRowid });
  });

  // Inventory Endpoints
  app.post('/api/inventory/supply', (req, res) => {
    const { supplier_id, product_id, quantity, weight } = req.body;
    db.prepare('UPDATE inventory SET quantity = quantity + ?, weight = weight + ? WHERE product_id = ?')
      .run(quantity, weight, product_id);
    db.prepare('INSERT INTO supply_history (supplier_id, product_id, quantity, weight) VALUES (?, ?, ?, ?)')
      .run(supplier_id, product_id, quantity, weight);
    
    // Notify Inventory Manager
    db.prepare('INSERT INTO notifications (user_id, role, message, type) SELECT user_id, "inventory", ?, "stock_received" FROM user_roles WHERE role = "inventory"')
      .run(`Supplier ${supplier_id} sent ${quantity} units of product ${product_id}`);

    res.json({ success: true });
  });

  app.get('/api/inventory/stats', (req, res) => {
    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT SUM(quantity) FROM inventory) as total_quantity,
        (SELECT SUM(weight) FROM inventory) as total_weight,
        (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'supplier') as total_suppliers,
        (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'customer') as total_customers,
        (SELECT COUNT(*) FROM inventory WHERE quantity < 10) as low_stock_count
    `).get();
    res.json(stats);
  });

  // Order Endpoints
  app.post('/api/orders', (req, res) => {
    const { customer_id, supplier_id, items, total_amount, gst_amount, status } = req.body;
    const orderStatus = status || 'pending';
    const insertOrder = db.prepare('INSERT INTO orders (customer_id, supplier_id, total_amount, gst_amount, status) VALUES (?, ?, ?, ?, ?)');
    const info = insertOrder.run(customer_id, supplier_id, total_amount, gst_amount, orderStatus);
    const orderId = info.lastInsertRowid;

    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
    for (const item of items) {
      insertItem.run(orderId, item.id, item.quantity, item.price);
    }

    // Notify Supplier
    db.prepare(`INSERT INTO notifications (user_id, role, message, type, order_id) VALUES (?, 'supplier', ?, 'new_order', ?)` )
      .run(supplier_id, `New order #ORD-${orderId} received from customer ${customer_id}`, orderId);

    if (orderStatus === 'Paid') {
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(total_amount, customer_id);
    }

    res.json({ orderId });
  });

  app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const order = db.prepare('SELECT customer_id, total_amount, status FROM orders WHERE id = ?').get(id);
    
    if (order && order.status === 'Paid') {
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(order.total_amount, order.customer_id);
    }

    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    res.json({ success: true });
  });

  app.post('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = db.prepare('SELECT customer_id, supplier_id, total_amount, status as old_status FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    
    if (status === 'rejected' && order.old_status === 'Paid') {
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(order.total_amount, order.customer_id);
    }

    // Notify Customer
    let message = `Your order #ORD-${id} status is now: ${status}`;
    db.prepare(`INSERT INTO notifications (user_id, role, message, type, order_id) VALUES (?, 'customer', ?, 'order_update', ?)` )
      .run(order.customer_id, message, id);

    if (status === 'completed') {
      // Deduct from inventory
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all();
      for (const item of items) {
        db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?').run(item.quantity, item.product_id);
        
        // Check for low stock
        const inv = db.prepare('SELECT quantity FROM inventory WHERE product_id = ?').get(item.product_id);
        if (inv.quantity < 10) {
          const product = db.prepare('SELECT name, supplier_id FROM products WHERE id = ?').get(item.product_id);
          
          // Notify Inventory Manager
          db.prepare(`INSERT INTO notifications (user_id, role, message, type) SELECT user_id, 'inventory', ?, 'low_stock' FROM user_roles WHERE role = 'inventory'` )
            .run(`Low stock alert: ${product.name} has only ${inv.quantity} units left`);
            
          // Notify Supplier
          db.prepare(`INSERT INTO notifications (user_id, role, message, type) VALUES (?, 'supplier', ?, 'low_stock')` )
            .run(product.supplier_id, `Your product ${product.name} is low on stock (${inv.quantity} units)`);
        }
      }
    } else if (status === 'cancelled') {
      // Notify Supplier about cancellation
      db.prepare(`INSERT INTO notifications (user_id, role, message, type, order_id) VALUES (?, 'supplier', ?, 'order_cancelled', ?)` )
        .run(order.supplier_id, `Order #ORD-${id} has been cancelled by the customer`, id);
    }
    res.json({ success: true });
  });

  app.get('/api/orders/customer/:id', (req, res) => {
    const orders = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(orders);
  });

  app.get('/api/orders/:id/items', (req, res) => {
    const items = db.prepare(`
      SELECT oi.*, p.name 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = ?
    `).all(req.params.id);
    res.json(items);
  });

  app.get('/api/orders/supplier/:id', (req, res) => {
    const orders = db.prepare(`
      SELECT o.*, u.username as customer_name 
      FROM orders o 
      JOIN users u ON o.customer_id = u.id 
      WHERE o.supplier_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.id);
    res.json(orders);
  });

  app.delete('/api/orders/customer/:id', (req, res) => {
    const customerId = req.params.id;
    db.prepare('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE customer_id = ?)').run(customerId);
    db.prepare('DELETE FROM orders WHERE customer_id = ?').run(customerId);
    res.json({ success: true });
  });



  // Production serving logic
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Vite middleware for development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
