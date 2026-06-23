const db = require("../database/db");
const bcrypt = require("bcryptjs");

class User {
  static async findById(id) {
    return await db.getAsync(
      `SELECT id, username, email, role, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );
  }

  static async findByUsername(username) {
    return await db.getAsync(
      `SELECT id, username, email, password_hash, role, created_at
       FROM users
       WHERE username = $1`,
      [username]
    );
  }

  static async findByEmail(email) {
    return await db.getAsync(
      `SELECT id, username, email, password_hash, role, created_at
       FROM users
       WHERE email = $1`,
      [email]
    );
  }

  static async create(userData) {
    const { username, email, password, role = "user" } = userData;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.runAsync(
      `INSERT INTO users
       (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [username, email, passwordHash, role]
    );

    return {
      id: result.lastID,
      username,
      email,
      role,
    };
  }

  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  static async getAll() {
    return await db.allAsync(
      `SELECT id, username, email, role, created_at
       FROM users
       ORDER BY created_at DESC`
    );
  }
}

module.exports = User;