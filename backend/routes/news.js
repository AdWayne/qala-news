const express = require("express");
const router = express.Router();
const fs = require("fs");
const News = require("../models/News");
const { authenticate, isAdmin } = require("../middleware/auth");
const { uploadMultiple } = require("../middleware/upload");
const cloudinary = require("cloudinary").v2;

// Настройка Cloudinary (берет ключи из твоего .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

// POST /api/news - Создать новость с изображениями
router.post('/', authenticate, isAdmin, uploadMultiple, async (req, res) => {
  try {
    const { title, content, excerpt, category_id, tags, is_featured } = req.body;
    
    if (!title || !content || !category_id) {
      return res.status(400).json({ error: 'Заголовок, содержание и категория обязательны' });
    }
    
    let images = [];
    let mainImage = null;
    
    // Загрузка файлов в Cloudinary
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'qala_news'
        });
        images.push(result.secure_url);
        
        // Удаляем временный файл с диска Render
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
      mainImage = images[0];
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
    
    const news = await News.create(newsData);
    res.status(201).json(news);
  } catch (error) {
    console.error('❌ Error creating news:', error);
    res.status(500).json({ error: 'Ошибка создания новости: ' + error.message });
  }
});

// PUT /api/news/:id - Обновить новость (только админ)
router.put("/:id", authenticate, isAdmin, uploadMultiple, async (req, res) => {
  try {
    const { title, content, excerpt, category_id, tags, is_featured, existing_images } = req.body;

    const existingNews = await News.getById(req.params.id);
    if (!existingNews) {
      return res.status(404).json({ error: "Новость не найдена" });
    }

    let images = [];
    let mainImage = existingNews.image_url;

    if (existing_images) {
      try {
        images = typeof existing_images === "string" ? JSON.parse(existing_images) : existing_images;
        if (Array.isArray(images) && images.length > 0) mainImage = images[0];
      } catch (e) {
        images = existingNews.images || [];
      }
    } else if (existingNews.images) {
      try {
        images = typeof existingNews.images === "string" ? JSON.parse(existingNews.images) : existingNews.images;
      } catch (e) {
        images = [];
      }
    }

    // Загрузка новых файлов в Cloudinary
    if (req.files && req.files.length > 0) {
      const newImages = [];
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'qala_news'
        });
        newImages.push(result.secure_url);
        
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
      
      images = [...images, ...newImages];
      if (!mainImage) mainImage = newImages[0];
    }

    if (images.length === 0 && existingNews.image_url) {
      images = [existingNews.image_url];
      mainImage = existingNews.image_url;
    }

    const news = await News.update(req.params.id, {
      title: title || existingNews.title,
      content: content || existingNews.content,
      excerpt: excerpt || existingNews.excerpt || content?.substring(0, 200),
      category_id: category_id ? parseInt(category_id) : existingNews.category_id,
      image_url: mainImage,
      images: images,
      tags: tags || existingNews.tags,
      is_featured: is_featured !== undefined ? parseInt(is_featured) : existingNews.is_featured,
    });

    res.json(news);
  } catch (error) {
    console.error("Error updating news:", error);
    res.status(500).json({ error: "Ошибка обновления новости: " + error.message });
  }
});

// DELETE /api/news/:id - Удалить новость (только админ)
router.delete("/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const existingNews = await News.getById(req.params.id);
    if (!existingNews) {
      return res.status(404).json({ error: "Новость не найдена" });
    }

    // Удаление из Cloudinary (опционально, если хочешь чистить облако)
    if (existingNews.images) {
      const imagesArr = typeof existingNews.images === 'string' ? JSON.parse(existingNews.images) : existingNews.images;
      for (const imgUrl of imagesArr) {
        try {
          const publicIdMatch = imgUrl.match(/\/qala_news\/([a-zA-Z0-9_-]+)/);
          if (publicIdMatch) await cloudinary.uploader.destroy(`qala_news/${publicIdMatch[1]}`);
        } catch (e) {
          console.error("Failed to delete image from Cloudinary:", e);
        }
      }
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
    if (!news) return res.status(404).json({ error: "Новость не найдена" });

    let images = news.images || [];
    if (typeof images === 'string') images = JSON.parse(images);
    
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

    // Удаляем из Cloudinary
    try {
      const publicIdMatch = imageUrl.match(/\/qala_news\/([a-zA-Z0-9_-]+)/);
      if (publicIdMatch) {
        await cloudinary.uploader.destroy(`qala_news/${publicIdMatch[1]}`);
      }
    } catch (e) {
      console.error("Error destroying image on Cloudinary:", e);
    }

    res.json({ message: "Изображение удалено" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Ошибка удаления изображения" });
  }
});

module.exports = router;