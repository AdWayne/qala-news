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
        conditions.push("(c.slug = ? OR c.name = ?)");
        params.push(category, category);
      }

      if (search) {
        conditions.push(
          "(n.title LIKE ? OR n.content LIKE ? OR n.excerpt LIKE ?)",
        );
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query +=
        " ORDER BY n.is_featured DESC, n.created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const news = await db.allAsync(query, params);
      return news;
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
        conditions.push("(c.slug = ? OR c.name = ?)");
        params.push(category, category);
      }

      if (search) {
        conditions.push(
          "(n.title LIKE ? OR n.content LIKE ? OR n.excerpt LIKE ?)",
        );
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
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
       WHERE n.id = ?`,
        [id],
      );

      if (news) {
        // Увеличиваем счетчик просмотров
        await db.runAsync("UPDATE news SET views = views + 1 WHERE id = ?", [
          id,
        ]);

        // Парсим JSON с изображениями
        if (news.images) {
          try {
            news.images = JSON.parse(news.images);
            console.log("📸 Parsed images:", news.images);
          } catch (e) {
            console.warn("⚠️ Could not parse images:", e);
            news.images = [];
          }
        } else {
          news.images = [];
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
      const news = await db.getAsync(
        `SELECT n.*, u.username as author_name, c.name as category_name, c.slug as category_slug
         FROM news n
         LEFT JOIN users u ON n.author_id = u.id
         LEFT JOIN categories c ON n.category_id = c.id
         WHERE n.is_featured = 1
         ORDER BY n.created_at DESC
         LIMIT 1`,
      );
      return news;
    } catch (error) {
      console.error("Error getting featured news:", error);
      throw error;
    }
  }

  static async getLatest(limit = 5) {
    try {
      const news = await db.allAsync(
        `SELECT n.*, u.username as author_name, c.name as category_name, c.slug as category_slug
         FROM news n
         LEFT JOIN users u ON n.author_id = u.id
         LEFT JOIN categories c ON n.category_id = c.id
         ORDER BY n.created_at DESC
         LIMIT ?`,
        [limit],
      );
      return news;
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
      is_featured = 0,
    } = newsData;

    try {
      // Получаем имя категории
      let category_name = null;
      if (category_id) {
        const category = await db.getAsync(
          "SELECT name FROM categories WHERE id = ?",
          [category_id],
        );
        if (category) category_name = category.name;
      }

      // Преобразуем массив изображений в JSON строку
      const imagesJson =
        images && images.length > 0 ? JSON.stringify(images) : null;

      console.log("💾 Saving to DB:", {
        title,
        category_id,
        image_url,
        imagesJson,
        author_id,
      });

      const result = await db.runAsync(
        `INSERT INTO news (title, content, excerpt, category_id, category_name, image_url, images, tags, author_id, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

      return await News.getById(result.lastID);
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
      is_featured = 0,
    } = newsData;

    try {
      let category_name = null;
      if (category_id) {
        const category = await db.getAsync(
          "SELECT name FROM categories WHERE id = ?",
          [category_id],
        );
        if (category) category_name = category.name;
      }

      const imagesJson = images ? JSON.stringify(images) : null;

      await db.runAsync(
        `UPDATE news 
         SET title = COALESCE(?, title),
             content = COALESCE(?, content),
             excerpt = COALESCE(?, excerpt),
             category_id = COALESCE(?, category_id),
             category_name = COALESCE(?, category_name),
             image_url = COALESCE(?, image_url),
             images = COALESCE(?, images),
             tags = COALESCE(?, tags),
             is_featured = COALESCE(?, is_featured),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
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
      // Получаем новость чтобы удалить файлы изображений
      const news = await News.getById(id);
      if (news && news.images) {
        const images =
          typeof news.images === "string"
            ? JSON.parse(news.images)
            : news.images;
        // Удаляем файлы
        const fs = require("fs");
        const path = require("path");
        images.forEach((img) => {
          const filePath = path.join(__dirname, "../../frontend", img);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      await db.runAsync("DELETE FROM news WHERE id = ?", [id]);
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
