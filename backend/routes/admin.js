const express = require('express');
const router = express.Router();
const User = require('../models/User');
const News = require('../models/News');
const { authenticate, isAdmin } = require('../middleware/auth');

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

module.exports = router;