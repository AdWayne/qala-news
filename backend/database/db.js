const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Определяем путь к базе данных
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'qala_news.db');

// Функция для инициализации базы данных
function initializeDatabase() {
  // Проверяем, существует ли файл базы данных
  const dbExists = fs.existsSync(DB_PATH);
  
  // Создаем подключение
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Ошибка подключения к базе данных:', err);
      return;
    }
    console.log('Подключено к базе данных SQLite');
    
    // Если базы данных нет, создаем таблицы
    if (!dbExists) {
      console.log('Создание таблиц...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      
      // Проверяем существование файла schema.sql
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema, (err) => {
          if (err) {
            console.error('Ошибка создания таблиц:', err);
          } else {
            console.log('Таблицы успешно созданы');
            
            // Проверяем, создался ли админ
            db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
              if (!err && row) {
                console.log('✅ Администратор создан (логин: admin, пароль: admin123)');
              }
            });
          }
        });
      } else {
        console.error('❌ Файл schema.sql не найден по пути:', schemaPath);
        console.log('Пожалуйста, создайте файл schema.sql в папке database');
      }
    } else {
      console.log('✅ База данных уже существует');
    }
  });
  
  return db;
}

// Создаем экземпляр базы данных
const db = initializeDatabase();

// Преобразование функций в промисы для удобства
const util = require('util');
db.getAsync = function(sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

db.allAsync = function(sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

db.runAsync = function(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

module.exports = db;