const db = require('../database/db');

class Category {
  // Получить все категории
  static async getAll() {
    try {
      const categories = await db.allAsync(
        'SELECT * FROM categories ORDER BY name'
      );
      return categories;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  // Получить категорию по ID
  static async getById(id) {
    try {
      const category = await db.getAsync(
        'SELECT * FROM categories WHERE id = ?',
        [id]
      );
      return category;
    } catch (error) {
      console.error('Error getting category by id:', error);
      throw error;
    }
  }

  // Получить категорию по slug
  static async getBySlug(slug) {
    try {
      const category = await db.getAsync(
        'SELECT * FROM categories WHERE slug = ?',
        [slug]
      );
      return category;
    } catch (error) {
      console.error('Error getting category by slug:', error);
      throw error;
    }
  }

  // Создать категорию
  static async create(categoryData) {
    const { name, slug, description, icon } = categoryData;
    try {
      const result = await db.runAsync(
        `INSERT INTO categories (name, slug, description, icon) 
         VALUES (?, ?, ?, ?)`,
        [name, slug, description || null, icon || null]
      );
      return await Category.getById(result.lastID);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Обновить категорию
  static async update(id, categoryData) {
    const { name, slug, description, icon } = categoryData;
    try {
      await db.runAsync(
        `UPDATE categories 
         SET name = COALESCE(?, name),
             slug = COALESCE(?, slug),
             description = COALESCE(?, description),
             icon = COALESCE(?, icon)
         WHERE id = ?`,
        [name, slug, description, icon, id]
      );
      return await Category.getById(id);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // Удалить категорию
  static async delete(id) {
    try {
      // Проверяем, есть ли новости в этой категории
      const newsCount = await db.getAsync(
        'SELECT COUNT(*) as count FROM news WHERE category_id = ?',
        [id]
      );
      
      if (newsCount.count > 0) {
        throw new Error('Нельзя удалить категорию, в которой есть новости');
      }
      
      await db.runAsync(
        'DELETE FROM categories WHERE id = ?',
        [id]
      );
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
}

module.exports = Category;