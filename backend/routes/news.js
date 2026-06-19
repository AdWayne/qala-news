const express = require("express");
const router = express.Router();
const News = require("../models/News");
const { authenticate, isAdmin } = require("../middleware/auth");
const { uploadMultiple } = require("../middleware/upload");

// GET /api/news - Получить все новости
router.get("/", async (req, res) => {
  try {
    const { limit = 20, offset = 0, category, search } = req.query;

    const news = await News.getAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      category,
      search,
    });

    const total = await News.getCount({ category, search });

    res.json({
      news,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Ошибка получения новостей" });
  }
});

// GET /api/news/featured - Получить главную новость
router.get("/featured", async (req, res) => {
  try {
    const news = await News.getFeatured();
    res.json(news || null);
  } catch (error) {
    console.error("Error fetching featured news:", error);
    res.status(500).json({ error: "Ошибка получения главной новости" });
  }
});

// GET /api/news/latest - Получить последние новости
router.get("/latest", async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const news = await News.getLatest(parseInt(limit));
    res.json(news);
  } catch (error) {
    console.error("Error fetching latest news:", error);
    res.status(500).json({ error: "Ошибка получения последних новостей" });
  }
});

// GET /api/news/:id - Получить новость по ID
router.get("/:id", async (req, res) => {
  try {
    const news = await News.getById(req.params.id);
    if (!news) {
      return res.status(404).json({ error: "Новость не найдена" });
    }
    res.json(news);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Ошибка получения новости" });
  }
});

// POST /api/news - Создать новость с изображениями (только админ)
// POST /api/news - Создать новость с изображениями
router.post('/', authenticate, isAdmin, uploadMultiple, async (req, res) => {
  try {
    console.log('📸 Files received:', req.files);
    console.log('📝 Body:', req.body);
    
    const { title, content, excerpt, category_id, tags, is_featured } = req.body;
    
    if (!title || !content || !category_id) {
      return res.status(400).json({ error: 'Заголовок, содержание и категория обязательны' });
    }
    
    // Обработка загруженных изображений
    let images = [];
    let mainImage = null;
    
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/${file.filename}`);
      mainImage = images[0];
      console.log('✅ Images saved:', images);
    } else {
      console.log('⚠️ No images uploaded');
    }
    
    const newsData = {
      title,
      content,
      excerpt: excerpt || content.substring(0, 200),
      category_id: parseInt(category_id),
      image_url: mainImage,
      images: images,
      tags: tags || null,
      author_id: req.user.id,
      is_featured: is_featured || 0
    };
    
    console.log('📦 News data:', newsData);
    
    const news = await News.create(newsData);
    console.log('✅ News created:', news.id);
    
    res.status(201).json(news);
  } catch (error) {
    console.error('❌ Error creating news:', error);
    res.status(500).json({ error: 'Ошибка создания новости: ' + error.message });
  }
});

// PUT /api/news/:id - Обновить новость (только админ)
router.put("/:id", authenticate, isAdmin, uploadMultiple, async (req, res) => {
  try {
    console.log("Updating news with files:", req.files);
    console.log("Body:", req.body);

    const {
      title,
      content,
      excerpt,
      category_id,
      tags,
      is_featured,
      existing_images,
    } = req.body;

    const existingNews = await News.getById(req.params.id);
    if (!existingNews) {
      return res.status(404).json({ error: "Новость не найдена" });
    }

    // Обработка изображений
    let images = [];
    let mainImage = existingNews.image_url;

    // Если есть существующие изображения в виде JSON строки
    if (existing_images) {
      try {
        images =
          typeof existing_images === "string"
            ? JSON.parse(existing_images)
            : existing_images;
        if (Array.isArray(images) && images.length > 0) {
          mainImage = images[0];
        }
      } catch (e) {
        console.warn("Error parsing existing_images:", e);
        images = existingNews.images || [];
      }
    } else if (existingNews.images) {
      // Если existing_images нет, но есть в базе
      try {
        images =
          typeof existingNews.images === "string"
            ? JSON.parse(existingNews.images)
            : existingNews.images;
      } catch (e) {
        images = [];
      }
    }

    // Добавляем новые загруженные файлы
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/${file.filename}`);
      images = [...images, ...newImages];
      if (!mainImage) {
        mainImage = newImages[0];
      }
      console.log("Added new images:", newImages);
    }

    // Если images пустой, но есть image_url, используем его
    if (images.length === 0 && existingNews.image_url) {
      images = [existingNews.image_url];
      mainImage = existingNews.image_url;
    }

    const news = await News.update(req.params.id, {
      title: title || existingNews.title,
      content: content || existingNews.content,
      excerpt: excerpt || existingNews.excerpt || content?.substring(0, 200),
      category_id: category_id
        ? parseInt(category_id)
        : existingNews.category_id,
      image_url: mainImage,
      images: images,
      tags: tags || existingNews.tags,
      is_featured:
        is_featured !== undefined
          ? parseInt(is_featured)
          : existingNews.is_featured,
    });

    res.json(news);
  } catch (error) {
    console.error("Error updating news:", error);
    res
      .status(500)
      .json({ error: "Ошибка обновления новости: " + error.message });
  }
});

// DELETE /api/news/:id - Удалить новость (только админ)
router.delete("/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const existingNews = await News.getById(req.params.id);
    if (!existingNews) {
      return res.status(404).json({ error: "Новость не найдена" });
    }

    await News.delete(req.params.id);
    res.json({ message: "Новость удалена успешно" });
  } catch (error) {
    console.error("Error deleting news:", error);
    res.status(500).json({ error: "Ошибка удаления новости" });
  }
});

// DELETE /api/news/:id/image - Удалить конкретное изображение
router.delete("/:id/image", authenticate, isAdmin, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: "URL изображения обязателен" });
    }

    const news = await News.getById(req.params.id);
    if (!news) {
      return res.status(404).json({ error: "Новость не найдена" });
    }

    let images = news.images || [];
    const updatedImages = images.filter((img) => img !== imageUrl);

    let mainImage = news.image_url;
    if (mainImage === imageUrl && updatedImages.length > 0) {
      mainImage = updatedImages[0];
    } else if (mainImage === imageUrl) {
      mainImage = null;
    }

    await News.update(req.params.id, {
      image_url: mainImage,
      images: updatedImages,
    });

    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(__dirname, "../../frontend", imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "Изображение удалено" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Ошибка удаления изображения" });
  }
});

module.exports = router;
