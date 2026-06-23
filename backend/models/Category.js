const db = require("../database/db");

class Category {
  static async getAll() {
    return await db.allAsync(
      `SELECT *
       FROM categories
       ORDER BY name`
    );
  }

  static async getById(id) {
    return await db.getAsync(
      `SELECT *
       FROM categories
       WHERE id = $1`,
      [id]
    );
  }

  static async getBySlug(slug) {
    return await db.getAsync(
      `SELECT *
       FROM categories
       WHERE slug = $1`,
      [slug]
    );
  }

  static async create(categoryData) {
    const { name, slug, description, icon } = categoryData;

    const result = await db.runAsync(
      `INSERT INTO categories
       (name, slug, description, icon)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [name, slug, description || null, icon || null]
    );

    return await Category.getById(result.lastID);
  }

  static async update(id, categoryData) {
    const { name, slug, description, icon } = categoryData;

    await db.runAsync(
      `UPDATE categories
       SET
         name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         description = COALESCE($3, description),
         icon = COALESCE($4, icon)
       WHERE id = $5`,
      [name, slug, description, icon, id]
    );

    return await Category.getById(id);
  }

  static async delete(id) {
    const newsCount = await db.getAsync(
      `SELECT COUNT(*)::int as count
       FROM news
       WHERE category_id = $1`,
      [id]
    );

    if (newsCount.count > 0) {
      throw new Error(
        "Нельзя удалить категорию, в которой есть новости"
      );
    }

    await db.runAsync(
      `DELETE FROM categories
       WHERE id = $1`,
      [id]
    );

    return true;
  }
}

module.exports = Category;