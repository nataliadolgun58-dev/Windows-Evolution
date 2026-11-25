
// Підключення бібліотеки Express
const express = require('express');

// Підключення модуля для роботи зі шляхами
const path = require('path');

// Створення Express-застосунку
const app = express();

// Визначення порту сервера
const PORT = process.env.PORT || 3000;

// Дозвіл серверу обробляти JSON
app.use(express.json());

// Підключення папки з вебсторінками та стилями
app.use(express.static(path.join(__dirname, 'public')));

// Головна сторінка сайту
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Перевірка працездатності сервера
app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'Windows Evolution server is running!'
    });
});

// API: каталог, статистика
app.use('/api', require('./routes/osRoutes'));
app.use('/api/compare', require('./routes/compareRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/import', require('./routes/importRoutes'));
app.use('/api/knowledge', require('./routes/knowledgeRoutes'));
app.use('/api/features', require('./routes/featureRoutes'));

// Обробка помилок
const { notFound, errorHandler } = require('./utils/errorHandler');
app.use(notFound);
app.use(errorHandler);

// Запуск сервера
require('./database/db').init().then(() => {
    app.listen(PORT, () => {
        console.log(`Windows Evolution запущено: http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Не вдалося відкрити базу даних:', err);
    process.exit(1);
});
