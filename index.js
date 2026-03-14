const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const DB_PATH = './database.json';
const INVITES = ["PREMIUM-2026", "BETA-ACCESS", "TOP-HVH"];

// Инициализация БД
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}));

// Регистрация
app.post('/api/register', (req, res) => {
    const { login, password, nickname, invite } = req.body;
    if (!INVITES.includes(invite)) return res.status(403).json({ error: "INVALID INVITE" });
    
    const db = JSON.parse(fs.readFileSync(DB_PATH));
    if (db[login]) return res.status(400).json({ error: "USER EXISTS" });

    db[login] = { password, nickname, elo: 100, level: 1, matches: 0, wins: 0 };
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    res.json({ success: true });
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
        const win = Math.random() > 0.4;
        const gain = win ? 25 : -20;
        
        db[login].elo += gain;
        if (db[login].elo < 100) db[login].elo = 100;
        db[login].matches += 1;
        if (win) db[login].wins += 1;
        
        // Расчет уровня Faceit
        let elo = db[login].elo;
        let lvl = 1;
        if(elo > 500) lvl = 2; if(elo > 800) lvl = 3; if(elo > 1100) lvl = 4;
        if(elo > 1400) lvl = 5; if(elo > 1700) lvl = 6; if(elo > 2000) lvl = 10;
        db[login].level = lvl;

        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        res.json({ win, gain, user: db[login] });
    }, 4000);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`Engine running on ${PORT}`));
