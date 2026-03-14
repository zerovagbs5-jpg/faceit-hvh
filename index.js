const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());
app.use(express.static('public'));

let onlineUsers = new Set();

// Регистрация и логин (добавь к существующим)
app.post('/api/login', (req, res) => {
    const { login } = req.body;
    onlineUsers.add(login); // Добавляем в онлайн
    res.json({ success: true, elo: 1000, level: 5 }); // Начальные данные
});

// Получение списка онлайн-игроков
app.get('/api/online', (req, res) => {
    res.json({ count: onlineUsers.size, users: Array.from(onlineUsers) });
});

// Имитация поиска матча
app.post('/api/matchmake', (req, res) => {
    setTimeout(() => {
        const win = Math.random() > 0.5;
        const eloChange = win ? 25 : -25;
        res.json({ win, eloChange, opponent: "ProPlayer_" + Math.floor(Math.random() * 100) });
    }, 5000); // 5 секунд поиска
});

app.listen(8080, '0.0.0.0', () => console.log("System Online"));
