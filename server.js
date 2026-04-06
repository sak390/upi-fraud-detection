const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'API is running!' });
});

// Login endpoint (for demo)
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'user@upishield.com' && password === 'user123456') {
        res.json({
            success: true,
            message: 'Login successful!',
            token: 'demo-token-12345',
            user: { email: 'user@upishield.com', role: 'user', username: 'DemoUser' }
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Register endpoint (for demo)
app.post('/api/auth/register', (req, res) => {
    res.json({ success: true, message: 'Registration successful!' });
});

// Check fraud endpoint
app.post('/api/users/check-fraud', (req, res) => {
    const { amount, receiver } = req.body;
    
    let riskScore = 5;
    let reasons = ['Amount within safe limit'];
    
    if (amount > 50000) {
        riskScore = 85;
        reasons = ['Amount exceeds ₹50,000 threshold'];
    } else if (amount > 25000) {
        riskScore = 55;
        reasons = ['Amount in moderate risk range'];
    }
    
    res.json({
        success: true,
        result: {
            status: riskScore > 70 ? 'critical' : (riskScore > 40 ? 'warning' : 'safe'),
            riskScore: riskScore,
            reasons: reasons,
            message: riskScore > 70 ? 'High risk!' : 'Transaction checked'
        }
    });
});

// Get transactions endpoint
app.get('/api/users/transactions', (req, res) => {
    const transactions = [
        { id: 1, amount: 2500, receiver_name: "Rahul Sharma", status: "safe", transaction_date: new Date().toISOString() },
        { id: 2, amount: 78500, receiver_name: "FakeMart", status: "suspicious", transaction_date: new Date().toISOString() }
    ];
    res.json({ success: true, transactions: transactions });
});

// Get profile endpoint
app.get('/api/users/profile', (req, res) => {
    res.json({
        success: true,
        user: {
            full_name: "Demo User",
            email: "user@upishield.com",
            phone: "9876543210",
            upi_id: "demo@okhdfcbank",
            username: "DemoUser"
        }
    });
});

// Serve frontend for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'login-register.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});