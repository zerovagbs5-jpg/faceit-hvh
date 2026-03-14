const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const DB_FILE = './users_database.json';
const MESSAGES_FILE = './chat_log.json';

// Инициализация базы данных
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}));
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, JSON.stringify([]));

// API: Регистрация с проверкой инвайта
app.post('/api/register', (req, res) => {
    const { login, password, nickname, invite } = req.body;
    const invites = ["PREMIUM-2026", "BETA-HVH", "FACEIT-ADMIN"]; // Твои инвайты

    if (!invites.includes(invite)) {
        return res.status(403).json({ error: "Invalid Invitation Key" });
    }

    const db = JSON.parse(fs.readFileSync(DB_FILE));
    if (db[login]) return res.status(400).json({ error: "User already exists" });

    db[login] = { password, nickname, elo: 1000, level: 3, matches: 0, wins: 0, created: new Date() };
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    res.json({ success: true });
});

// API: Вход
app.post('/api/login', (req, res) => {
    const { login, password } = req.body;
    const db = JSON.parse(fs.readFileSync(DB_FILE));

    if (db[login] && db[login].password === password) {
        res.json({ success: true, userData: db[login] });
    } else {
        res.status(401).json({ error: "Wrong credentials" });
    }
});

// API: Поиск матча (Симуляция)
app.post('/api/find-match', (req, res) => {
    const { login } = req.body;
    setTimeout(() => {
        const db = JSON.parse(fs.readFileSync(DB_FILE));
        const win = Math.random() > 0.45; // 55% шанс победы
        const eloGain = win ? 25 : -25;
        
        if (db[login]) {
            db[login].elo += eloGain;
            db[login].matches += 1;
            if (win) db[login].wins += 1;
            // Пересчет уровня
            db[login].level = Math.min(10, Math.max(1, Math.floor(db[login].elo / 250)));
            fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        }
        res.json({ win, eloGain, newStats: db[login] });
    }, 4500);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`[SYSTEM] Cloud Engine started on port ${PORT}`));
