const express = require('express');
const router = express.Router();
const User = require('../models/User');
const News = require('../models/News');
const { authenticate, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Получить статистику (только админ)
router.get('/stats', authenticate, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.getAll();
    const totalNews = await News.getCount();
    const categories = await News.getCategories();
    
    res.json({
      totalUsers: totalUsers.length,
      totalNews,
      categories
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// Получить всех пользователей (только админ)
router.get('/users', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
});

router.post('/news', authenticate, isAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const { title, content, excerpt, category_id, tags, is_featured } = req.body;

    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      // Сохраняем пути к файлам
      imagePaths = req.files.map(file => `/uploads/${file.filename}`); 
    }

    const mainImageUrl = imagePaths.length > 0 ? imagePaths[0] : null;

    const newArticle = await News.create({
      title,
      content,
      excerpt,
      category_id,
      tags,
      is_featured: is_featured === '1' || is_featured === 'true' || is_featured === true,
      image_url: mainImageUrl, 
      images: imagePaths       
    });

    res.status(201).json(newArticle);
  } catch (error) {
    console.error('Ошибка создания новости:', error);
    res.status(500).json({ error: 'Ошибка сервера при создании новости' });
  }
});

module.exports = router;