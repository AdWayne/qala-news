const db = require('../database/db');
const bcrypt = require('bcryptjs');

class User {
  // Найти пользователя по ID
  static async findById(id) {
    try {
      const user = await db.getAsync(
        'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
        [id]
      );
      return user;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  // Найти пользователя по имени пользователя
  static async findByUsername(username) {
    try {
      const user = await db.getAsync(
        'SELECT id, username, email, password_hash, role, created_at FROM users WHERE username = ?',
        [username]
      );
      return user;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  // Найти пользователя по email
  static async findByEmail(email) {
    try {
      const user = await db.getAsync(
        'SELECT id, username, email, password_hash, role, created_at FROM users WHERE email = ?',
        [email]
      );
      return user;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Создать нового пользователя
  static async create(userData) {
    const { username, email, password, role = 'user' } = userData;
    
    try {
      // Хешируем пароль
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      const result = await db.runAsync(
        `INSERT INTO users (username, email, password_hash, role) 
         VALUES (?, ?, ?, ?)`,
        [username, email, passwordHash, role]
      );
      
      return {
        id: result.lastID,
        username,
        email,
        role
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Проверить пароль
  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  // Получить всех пользователей (только для админа)
  static async getAll() {
    try {
      const users = await db.allAsync(
        'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
      );
      return users;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }
}

module.exports = User;