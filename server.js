const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// --- Essential Middleware ---
// Allows your frontend to call the API from a different address
app.use(cors());
// Parses JSON data from requests (like login details)
app.use(express.json());

// --- API Routes (Must be defined BEFORE the catch-all route) ---

// 1. Health Check Route
app.get('/api/health', (req, res) => {
    // This MUST return JSON, not HTML
    res.json({ success: true, message: 'API is running!' });
});

// 2. Login Route
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    // Simple demo check
    if (email === 'user@upishield.com' && password === 'user123456') {
        return res.json({
            success: true,
            message: 'Login successful!',
            token: 'demo-token-123',
            user: { email: email, role: 'user', username: 'DemoUser' }
        });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// 3. Fraud Check Route (Example)
app.post('/api/users/check-fraud', (req, res) => {
    const { amount, receiver } = req.body;
    let riskScore = 5;
    if (amount > 50000) riskScore = 85;
    else if (amount > 25000) riskScore = 55;
    
    return res.json({
        success: true,
        result: { status: riskScore > 70 ? 'critical' : 'warning', riskScore: riskScore, reasons: ['Amount checked'] }
    });
});

// 4. Get Transactions Route (Example)
app.get('/api/users/transactions', (req, res) => {
    return res.json({ success: true, transactions: [] });
});

// 5. Get Profile Route (Example)
app.get('/api/users/profile', (req, res) => {
    return res.json({ success: true, user: { full_name: 'Demo User', email: 'user@upishield.com' } });
});

// --- VERY IMPORTANT: This catch-all route must be LAST ---
// It serves your frontend HTML file for any other request.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'login-register.html'));
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`✅ Server running correctly on port ${PORT}`);
});
