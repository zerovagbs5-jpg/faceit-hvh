const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/register', (req, res) => {
    const { nickname, soft } = req.body;
    const log = `[${new Date().toLocaleString()}] Name: ${nickname} | Soft: ${soft}\n`;
    fs.appendFileSync('database.txt', log);
    res.send('<h1>Success!</h1><a href="/">Back</a>');
});

// Railway сам подставит нужный порт через process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
