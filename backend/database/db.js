const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL error:", err);
});

const db = {
  async getAsync(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  },

  async allAsync(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows;
  },

  async runAsync(sql, params = []) {
    const result = await pool.query(sql, params);

    return {
      rows: result.rows,
      rowCount: result.rowCount,
      lastID: result.rows?.[0]?.id || null,
    };
  },
};

module.exports = db;
