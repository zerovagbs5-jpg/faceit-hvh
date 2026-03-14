const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

// ВАЖНО: Эта строка говорит серверу отдавать index.html из текущей папки
app.use(express.static(__dirname)); 

const DB_PATH = './database.json';
const INVITES = ["PREMIUM-2026", "BETA-ACCESS", "TOP-HVH"];

if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}));

// Главная страница (на всякий случай добавим прямой роут)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Регистрация
app.post('/api/register', (req, res) => {
    try {
        const { login, password, nickname, invite } = req.body;
        if (!INVITES.includes(invite)) return res.status(403).json({ error: "INVALID INVITE" });
        
        const db = JSON.parse(fs.readFileSync(DB_PATH));
        if (db[login]) return res.status(400).json({ error: "USER EXISTS" });

        db[login] = { password, nickname, elo: 100, level: 1, matches: 0, wins: 0 };
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "SERVER ERROR" });
    }
});

// Вход
app.post('/api/login', (req, res) => {
    const { login, password } = req.body;
    const db = JSON.parse(fs.readFileSync(DB_PATH));
    if (db[login] && db[login].password === password) {
        res.json({ success: true, user: db[login] });
    } else {
        res.status(401).json({ error: "WRONG AUTH" });
    }
});

// Матчмейкинг
app.post('/api/match', (req, res) => {
    const { login } = req.body;
    setTimeout(() => {
        const db = JSON.parse(fs.readFileSync(DB_PATH));
        if (!db[login]) return res.status(404).send();

        const win = Math.random() > 0.4;
        const gain = win ? 25 : -20;
        
        db[login].elo += gain;
        if (db[login].elo < 100) db[login].elo = 100;
        db[login].matches += 1;
        if (win) db[login].wins += 1;
        
        let elo = db[login].elo;
        let lvl = 1;
        if(elo > 300) lvl = 2; if(elo > 500) lvl = 3; if(elo > 800) lvl = 4;
        if(elo > 1100) lvl = 5; if(elo > 1400) lvl = 8; if(elo > 1800) lvl = 10;
        db[login].level = lvl;

        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        res.json({ win, gain, user: db[login] });
    }, 4000);
});

// Используем порт 8080 для Replit
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FACEIT.CC] Engine running on port ${PORT}`);
});
