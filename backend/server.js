const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⚠️ ВАЖНО: Сначала подключаем API маршруты
// Маршруты API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/news', require('./routes/news'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/categories', require('./routes/categories'));

// Потом статические файлы
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../frontend/uploads')));

// Подключение базы данных
require('./database/db');

// Обработка ошибок
app.use(require('./middleware/errorHandler'));

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📱 Фронтенд доступен по адресу http://localhost:${PORT}`);
  console.log(`🔗 API доступен по адресу http://localhost:${PORT}/api`);
});