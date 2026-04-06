function generateUserId() {
    return 'USR' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function generateTransactionId() {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function generateAlertId() {
    return 'ALT' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function calculateRiskScore(amount, receiver) {
    let riskScore = 0;
    let reasons = [];
    
    if (amount > 50000) {
        riskScore += 60;
        reasons.push('Amount exceeds ₹50,000 threshold');
    } else if (amount > 25000) {
        riskScore += 30;
        reasons.push('Amount in moderate risk range');
    } else {
        riskScore += 5;
        reasons.push('Amount within safe limit');
    }
    
    const suspiciousKeywords = ['cash', 'lottery', 'prize', 'winner', 'free', 'offer'];
    if (receiver && suspiciousKeywords.some(k => receiver.toLowerCase().includes(k))) {
        riskScore += 25;
        reasons.push('Suspicious keyword detected');
    }
    
    return { riskScore: Math.min(riskScore, 100), reasons };
}

module.exports = { generateUserId, generateTransactionId, generateAlertId, calculateRiskScore };
