const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const DB_PATH = './database.txt';
const INVITES_PATH = './invites.json';
const MESSAGES_PATH = './messages.json';

// Инициализация файлов, если их нет
if (!fs.existsSync(MESSAGES_PATH)) fs.writeFileSync(MESSAGES_PATH, JSON.stringify([]));
if (!fs.existsSync(INVITES_PATH)) fs.writeFileSync(INVITES_PATH, JSON.stringify(["PREMIUM-2026", "BETA-ACCESS"]));

// Регистрация
app.post('/api/register', (req, res) => {
    try {
        const { login, password, nickname, invite } = req.body;
        const invites = JSON.parse(fs.readFileSync(INVITES_PATH, 'utf8'));

        if (!invites.includes(invite)) {
            return res.status(403).json({ success: false, message: "Invalid Invitation Key" });
        }

        const entry = `[REG] ${new Date().toISOString()} | L: ${login} | P: ${password} | N: ${nickname} | I: ${invite}\n`;
        fs.appendFileSync(DB_PATH, entry);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// Вход
app.post('/api/login', (req, res) => {
    const { login, password } = req.body;
    fs.appendFileSync(DB_PATH, `[LOGIN] ${new Date().toISOString()} | L: ${login} | P: ${password}\n`);
    res.json({ success: true, token: "sess_" + Math.random().toString(36).substr(2) });
});

// Чат (получение сообщений)
app.get('/api/chat', (req, res) => {
    const msgs = JSON.parse(fs.readFileSync(MESSAGES_PATH, 'utf8'));
    res.json(msgs.slice(-50)); // Последние 50
});

// Чат (отправка)
app.post('/api/chat', (req, res) => {
    const { user, text } = req.body;
    const msgs = JSON.parse(fs.readFileSync(MESSAGES_PATH, 'utf8'));
    const newMsg = { user, text, time: new Date().toLocaleTimeString() };
    msgs.push(newMsg);
    fs.writeFileSync(MESSAGES_PATH, JSON.stringify(msgs));
    res.json(newMsg);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
