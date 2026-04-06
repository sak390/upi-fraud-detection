const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./src/config/database');
const { generateUserId, generateTransactionId, generateAlertId, calculateRiskScore } = require('./src/utils/helpers');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;
app.use(cors());
app.use(express.json());
// ============================================
// Authentication Middleware
// ============================================
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
};
// ============================================
// Create Tables
// ============================================
const createTables = async () => {
    await db.runAsync(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE,
        username TEXT,
        full_name TEXT,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password TEXT,
        upi_id TEXT,
        balance REAL DEFAULT 5000,
        role TEXT DEFAULT 'user',
        status TEXT DEFAULT 'active',
        registered_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    await db.runAsync(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT UNIQUE,
        user_id INTEGER,
        amount REAL,
        receiver_name TEXT,
        receiver_upi TEXT,
        status TEXT DEFAULT 'safe',
        risk_score INTEGER DEFAULT 0,
        fraud_reason TEXT,
        transaction_date TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
    await db.runAsync(`CREATE TABLE IF NOT EXISTS fraud_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id TEXT UNIQUE,
        transaction_id INTEGER,
        user_id INTEGER,
        alert_type TEXT,
        severity TEXT,
        message TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
    await db.runAsync(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        message TEXT,
        type TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
    console.log('✅ Database tables created');
};
// ============================================
// Create Default Users
// ============================================
const createDefaultUsers = async () => {
    const admin = await db.getAsync('SELECT id FROM users WHERE email = ?', ['admin@upishield.com']);
    if (!admin) {
        const hashedPassword = await bcrypt.hash('admin123456', 10);
        const userId = generateUserId();
        await db.runAsync(
            `INSERT INTO users (user_id, username, full_name, email, phone, password, role) 
             VALUES (?, ?, ?, ?, ?, ?, 'admin')`,
            [userId, 'Admin', 'System Administrator', 'admin@upishield.com', '9999999999', hashedPassword]
        );
        console.log('✅ Default admin created: admin@upishield.com / admin123456');
    }
    const demoUser = await db.getAsync('SELECT id FROM users WHERE email = ?', ['user@upishield.com']);
    if (!demoUser) {
        const hashedPassword = await bcrypt.hash('user123456', 10);
        const userId = generateUserId();
        await db.runAsync(
            `INSERT INTO users (user_id, username, full_name, email, phone, upi_id, password, balance, role) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 25000, 'user')`,
            [userId, 'DemoUser', 'Demo User', 'user@upishield.com', '9876543210', 'demo@okhdfcbank', hashedPassword]
        );
        console.log('✅ Demo user created: user@upishield.com / user123456');
        const userRecord = await db.getAsync('SELECT id FROM users WHERE email = ?', ['user@upishield.com']);
        const sampleTransactions = [
            { amount: 2500, receiver: "Rahul Sharma", status: "safe", risk: 5 },
            { amount: 78500, receiver: "FakeMart Pvt Ltd", status: "suspicious", risk: 85 },
            { amount: 450, receiver: "Kiran Cafe", status: "safe", risk: 5 },
            { amount: 122000, receiver: "Unknown Global Trading", status: "suspicious", risk: 90 },
            { amount: 1200, receiver: "Groceries Store", status: "safe", risk: 5 },
            { amount: 34000, receiver: "QuickCash Services", status: "suspicious", risk: 55 },
            { amount: 560, receiver: "Electricity Bill", status: "safe", risk: 5 },
            { amount: 95000, receiver: "Luxury Goods", status: "suspicious", risk: 85 }
        ];
        for (const t of sampleTransactions) {
            const transactionId = generateTransactionId();
            await db.runAsync(
                `INSERT INTO transactions (transaction_id, user_id, amount, receiver_name, status, risk_score) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [transactionId, userRecord.id, t.amount, t.receiver, t.status, t.risk]
            );
        }
        console.log('✅ Sample transactions added');
    }
};
// ============================================
// AUTH ROUTES
// ============================================
app.post('/api/auth/register', async (req, res) => {
    const { fullName, email, phone, password } = req.body;
    try {
        const existing = await db.getAsync('SELECT id FROM users WHERE email = ? OR phone = ?', [email, phone]);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email or phone already registered' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = generateUserId();
        await db.runAsync(
            `INSERT INTO users (user_id, username, full_name, email, phone, password, role) 
             VALUES (?, ?, ?, ?, ?, ?, 'user')`,
            [userId, fullName.split(' ')[0], fullName, email, phone, hashedPassword]
        );
        const user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({ success: true, message: 'Registration successful!', token, user: { userId: user.user_id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.getAsync('SELECT * FROM users WHERE email = ? AND role = "user"', [email]);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        res.json({ success: true, message: 'Login successful!', token, user: { userId: user.user_id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});
app.post('/api/auth/admin/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await db.getAsync('SELECT * FROM users WHERE email = ? AND role = "admin"', [email]);
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }
        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }
        const token = jwt.sign(
            { userId: admin.id, email: admin.email, role: admin.role, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        res.json({ success: true, message: 'Admin login successful!', token, user: { userId: admin.user_id, username: admin.username, email: admin.email, role: admin.role } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});
// ============================================
// USER ROUTES
// ============================================
app.get('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const user = await db.getAsync(
            'SELECT user_id, username, full_name, email, phone, upi_id, balance FROM users WHERE id = ?',
            [req.user.userId]
        );
        if (user) {
            res.json({ success: true, user });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
});
app.put('/api/users/profile', authenticateToken, async (req, res) => {
    const { fullName, phone, upiId } = req.body;
    try {
        await db.runAsync(
            'UPDATE users SET full_name = ?, phone = ?, upi_id = ? WHERE id = ?',
            [fullName, phone, upiId, req.user.userId]
        );
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});
app.post('/api/users/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await db.getAsync('SELECT password FROM users WHERE id = ?', [req.user.userId]);
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.runAsync('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.userId]);
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
});
app.get('/api/users/transactions', authenticateToken, async (req, res) => {
    try {
        const transactions = await db.allAsync(
            'SELECT id, transaction_id, amount, receiver_name, receiver_upi, status, risk_score, transaction_date FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC',
            [req.user.userId]
        );
        res.json({ success: true, transactions: transactions || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
    }
});
app.post('/api/users/check-fraud', authenticateToken, async (req, res) => {
    const { amount, receiver } = req.body;
    const { riskScore, reasons } = calculateRiskScore(amount, receiver);
    let status = 'safe';
    let message = '';
    if (riskScore > 70) {
        status = 'critical';
        message = '🔴 CRITICAL RISK! This transaction appears to be fraudulent.';
    } else if (riskScore > 40) {
        status = 'warning';
        message = '🟠 WARNING! This transaction has high risk.';
    } else {
        status = 'safe';
        message = '🟢 SAFE! This transaction appears legitimate.';
    }
    res.json({ success: true, result: { status, riskScore, reasons, message } });
});
app.post('/api/users/transaction', authenticateToken, async (req, res) => {
    const { amount, receiver, upiId } = req.body;
    try {
        const user = await db.getAsync('SELECT balance FROM users WHERE id = ?', [req.user.userId]);
        if (user.balance < amount) {
            return res.status(400).json({ success: false, message: 'Insufficient balance' });
        }
        const { riskScore, reasons } = calculateRiskScore(amount, receiver);
        const status = riskScore > 40 ? 'suspicious' : 'safe';
        const transactionId = generateTransactionId();
        await db.runAsync(
            `INSERT INTO transactions (transaction_id, user_id, amount, receiver_name, receiver_upi, status, risk_score, fraud_reason) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [transactionId, req.user.userId, amount, receiver, upiId, status, riskScore, reasons.join(', ')]
        );
        await db.runAsync('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, req.user.userId]);
        const updatedUser = await db.getAsync('SELECT balance FROM users WHERE id = ?', [req.user.userId]);
        if (status === 'suspicious') {
            const alertId = generateAlertId();
            await db.runAsync(
                `INSERT INTO fraud_alerts (alert_id, user_id, alert_type, severity, message, status) 
                 VALUES (?, ?, 'high_amount', ?, ?, 'pending')`,
                [alertId, req.user.userId, riskScore > 70 ? 'critical' : 'high', `High risk transaction of ₹${amount} detected. Risk score: ${riskScore}%`]
            );
        }
        res.json({ success: true, message: status === 'suspicious' ? '⚠️ Transaction flagged for review' : '✅ Transaction successful', newBalance: updatedUser.balance, status, riskScore });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Transaction failed' });
    }
});
// ============================================
// Health Check
// ============================================
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'API is running!', timestamp: new Date().toISOString() });
});
// ============================================
// Start Server
// ============================================
const startServer = async () => {
    await createTables();
    await createDefaultUsers();
    app.listen(PORT, () => {
        console.log('========================================');
        console.log('UPI Fraud Detection Backend Server');
        console.log(`Server running on port ${PORT}`);
        console.log('========================================');
        console.log('Demo Credentials:');
        console.log('  Admin: admin@upishield.com / admin123456');
        console.log('  User:  user@upishield.com / user123456');
        console.log('========================================');
    });
};
startServer();
