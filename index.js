const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
// Отдаем файлы из корневой папки (index.html, стили и т.д.)
app.use(express.static(__dirname));

const DB_PATH = './database.json';
const INVITES_PATH = './invites.json';

// --- ИНИЦИАЛИЗАЦИЯ ФАЙЛОВ (Создаются сами, если их нет) ---
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
    console.log("[INIT] Файл database.json создан.");
}

if (!fs.existsSync(INVITES_PATH)) {
    // Если файла нет, создаем его с твоими новыми инвайтами
    const defaultInvites = [
        "a92837f28282s-193832q-28282x",
        "b83822vkeet28382-483838-12929z",
        "e829t1392e49394g-1392h29383i122"
    ];
    fs.writeFileSync(INVITES_PATH, JSON.stringify(defaultInvites, null, 2));
    console.log("[INIT] Файл invites.json создан с дефолтными кодами.");
}

// --- API: РЕГИСТРАЦИЯ ---
app.post('/api/register', (req, res) => {
    try {
        const { login, password, nickname, invite } = req.body;

        // 1. Валидация полей
        if (!login || !password || !nickname || !invite) {
            return res.status(400).json({ error: "Заполните все поля!" });
        }

        // 2. Проверка инвайта из файла
        const invites = JSON.parse(fs.readFileSync(INVITES_PATH, 'utf8'));
        const inviteIndex = invites.indexOf(invite.trim());

        if (inviteIndex === -1) {
            console.log(`[AUTH] Отказ: Неверный инвайт [${invite}]`);
            return res.status(403).json({ error: "INVALID INVITE" });
        }

        // 3. Проверка существования юзера
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        if (db[login]) {
            return res.status(400).json({ error: "Такой логин уже занят!" });
        }

        // 4. Сохранение юзера
        db[login] = { 
            password, 
            nickname, 
            elo: 100, 
            level: 1, 
            matches: 0, 
            wins: 0,
            regDate: new Date().toISOString()
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

        // 5. ОПЦИОНАЛЬНО: Удаление инвайта после использования (сделай ключи одноразовыми)
        // invites.splice(inviteIndex, 1);
        // fs.writeFileSync(INVITES_PATH, JSON.stringify(invites, null, 2));

        console.log(`[SUCCESS] Зарегистрирован: ${nickname} (Login: ${login})`);
        res.json({ success: true });

    } catch (err) {
        console.error("[SERVER ERROR]", err);
        res.status(500).json({ error: "Ошибка сервера при регистрации" });
    }
});

// --- API: ВХОД ---
app.post('/api/login', (req, res) => {
    try {
        const { login, password } = req.body;
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

        if (db[login] && db[login].password === password) {
            console.log(`[LOGIN] Юзер вошел: ${db[login].nickname}`);
            res.json({ success: true, user: db[login] });
        } else {
            res.status(401).json({ error: "Неверный логин или пароль" });
        }
    } catch (err) {
        res.status(500).json({ error: "Ошибка при входе" });
    }
});

// --- API: МАТЧМЕЙКИНГ ---
app.post('/api/match', (req, res) => {
    try {
        const { login } = req.body;
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

        if (!db[login]) return res.status(404).json({ error: "User not found" });

        // Имитация поиска 4 секунды
        setTimeout(() => {
            const isWin = Math.random() > 0.45; // 55% шанс победы
            const points = isWin ? 25 : -20;

            db[login].elo += points;
            if (db[login].elo < 0) db[login].elo = 0;
            db[login].matches += 1;
            if (isWin) db[login].wins += 1;

            // Расчет уровня FACEIT (1-10)
            let e = db[login].elo;
            let lvl = 1;
            if (e >= 200) lvl = 2; if (e >= 400) lvl = 3; if (e >= 600) lvl = 4;
            if (e >= 800) lvl = 5; if (e >= 1000) lvl = 6; if (e >= 1200) lvl = 7;
            if (e >= 1400) lvl = 8; if (e >= 1600) lvl = 9; if (e >= 2000) lvl = 10;
            db[login].level = lvl;

            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
            
            console.log(`[MATCH] ${db[login].nickname}: ${isWin ? 'WIN' : 'LOSS'} (${points} ELO)`);
            res.json({ win: isWin, gain: points, user: db[login] });
        }, 4000);

    } catch (err) {
        res.status(500).json({ error: "Matchmaking failed" });
    }
});

// --- ЗАПУСК ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log("-----------------------------------------");
    console.log(`[SYSTEM] FACEIT.CC ENGINE STARTED`);
    console.log(`[SYSTEM] PORT: ${PORT}`);
    console.log("-----------------------------------------");
});
