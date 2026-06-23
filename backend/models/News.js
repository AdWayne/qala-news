const db = require("../database/db");

class News {
  static async getAll({
    limit = 20,
    offset = 0,
    category = null,
    search = null,
  } = {}) {
    try {
      let query = `
        SELECT n.*, u.username as author_name, c.name as category_name, c.slug as category_slug
        FROM news n
        LEFT JOIN users u ON n.author_id = u.id
        LEFT JOIN categories c ON n.category_id = c.id
      `;
      const params = [];
      const conditions = [];

      if (category) {
        params.push(category, category);
        conditions.push(
          `(c.slug = $${params.length - 1} OR c.name = $${params.length})`,
        );
      }

      if (search) {
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
        conditions.push(
          `(n.title LIKE $${params.length - 2} OR n.content LIKE $${params.length - 1} OR n.excerpt LIKE $${params.length})`,
        );
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      params.push(limit, offset);
      query += ` ORDER BY n.is_featured DESC, n.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

      return await db.allAsync(query, params);
    } catch (error) {
      console.error("Error getting news:", error);
      throw error;
    }
  }

  static async getCount({ category = null, search = null } = {}) {
    try {
      let query =
        "SELECT COUNT(*) as count FROM news n LEFT JOIN categories c ON n.category_id = c.id";
      const params = [];
      const conditions = [];

      if (category) {
        params.push(category, category);
        conditions.push(
          `(c.slug = $${params.length - 1} OR c.name = $${params.length})`,
        );
      }

      if (search) {
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
        conditions.push(
          `(n.title LIKE $${params.length - 2} OR n.content LIKE $${params.length - 1} OR n.excerpt LIKE $${params.length})`,
        );
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      const result = await db.getAsync(query, params);
      return result.count;
    } catch (error) {
      console.error("Error getting news count:", error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const news = await db.getAsync(
        `SELECT n.*, u.username as author_name, c.name as category_name, c.slug as category_slug
         FROM news n
         LEFT JOIN users u ON n.author_id = u.id
         LEFT JOIN categories c ON n.category_id = c.id
         WHERE n.id = $1`,
        [id],
      );

      if (news) {
        await db.runAsync("UPDATE news SET views = views + 1 WHERE id = $1", [
          id,
        ]);
        if (typeof news.images === "string") {
          news.images = JSON.parse(news.images);
        }
      }
      return news;
    } catch (error) {
      console.error("Error getting news by id:", error);
      throw error;
    }
  }

  static async getFeatured() {
    try {
      // is_featured в Postgres должен сравниваться с boolean или корректным типом
      return await db.getAsync(
        `SELECT n.*, u.username as author_name, c.name as category_name, c.slug as category_slug
         FROM news n
         LEFT JOIN users u ON n.author_id = u.id
         LEFT JOIN categories c ON n.category_id = c.id
         WHERE n.is_featured = true
         ORDER BY n.created_at DESC
         LIMIT 1`,
      );
    } catch (error) {
      console.error("Error getting featured news:", error);
      throw error;
    }
  }

  static async getLatest(limit = 5) {
    try {
      return await db.allAsync(
        `SELECT n.*, u.username as author_name, c.name as category_name, c.slug as category_slug
         FROM news n
         LEFT JOIN users u ON n.author_id = u.id
         LEFT JOIN categories c ON n.category_id = c.id
         ORDER BY n.created_at DESC
         LIMIT $1`,
        [limit],
      );
    } catch (error) {
      console.error("Error getting latest news:", error);
      throw error;
    }
  }

  static async create(newsData) {
    const {
      title,
      content,
      excerpt,
      category_id,
      image_url,
      images,
      tags,
      author_id,
      is_featured = false,
    } = newsData;
    try {
      let category_name = null;
      if (category_id) {
        const category = await db.getAsync(
          "SELECT name FROM categories WHERE id = $1",
          [category_id],
        );
        if (category) category_name = category.name;
      }

      const imagesJson = images ? JSON.stringify(images) : null;
      const result = await db.runAsync(
        `INSERT INTO news (title, content, excerpt, category_id, category_name, image_url, images, tags, author_id, is_featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          title,
          content,
          excerpt || content.substring(0, 200),
          category_id || null,
          category_name,
          image_url || null,
          imagesJson,
          tags || null,
          author_id,
          is_featured,
        ],
      );

      return await News.getById(result.rows[0]?.id || result.lastID);
    } catch (error) {
      console.error("Error creating news:", error);
      throw error;
    }
  }

  static async update(id, newsData) {
    const {
      title,
      content,
      excerpt,
      category_id,
      image_url,
      images,
      tags,
      is_featured,
    } = newsData;
    try {
      let category_name = null;
      if (category_id) {
        const category = await db.getAsync(
          "SELECT name FROM categories WHERE id = $1",
          [category_id],
        );
        if (category) category_name = category.name;
      }

      const imagesJson = images ? JSON.stringify(images) : null;

      await db.runAsync(
        `UPDATE news SET 
            title = COALESCE($1, title),
            content = COALESCE($2, content),
            excerpt = COALESCE($3, excerpt),
            category_id = COALESCE($4, category_id),
            category_name = COALESCE($5, category_name),
            image_url = COALESCE($6, image_url),
            images = COALESCE($7, images),
            tags = COALESCE($8, tags),
            is_featured = COALESCE($9, is_featured),
            updated_at = CURRENT_TIMESTAMP
         WHERE id = $10`,
        [
          title,
          content,
          excerpt,
          category_id,
          category_name,
          image_url,
          imagesJson,
          tags,
          is_featured,
          id,
        ],
      );
      return await News.getById(id);
    } catch (error) {
      console.error("Error updating news:", error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await db.runAsync("DELETE FROM news WHERE id = $1", [id]);
      return true;
    } catch (error) {
      console.error("Error deleting news:", error);
      throw error;
    }
  }

  static async getCategories() {
    try {
      const categories = await db.allAsync(
        "SELECT DISTINCT category_name FROM news WHERE category_name IS NOT NULL ORDER BY category_name",
      );
      return categories.map((c) => c.category_name);
    } catch (error) {
      console.error("Error getting categories:", error);
      throw error;
    }
  }
}

module.exports = News;
