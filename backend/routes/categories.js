const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authenticate, isAdmin } = require('../middleware/auth');

// GET /api/categories - Получить все категории
router.get('/', async (req, res) => {
  try {
    const categories = await Category.getAll();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Ошибка получения категорий' });
  }
});

// GET /api/categories/:id - Получить категорию по ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.getById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Ошибка получения категории' });
  }
});

// POST /api/categories - Создать категорию (только админ)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, slug, description, icon } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: 'Название и slug обязательны' });
    }
    
    // Проверяем, существует ли категория с таким slug
    const existing = await Category.getBySlug(slug);
    if (existing) {
      return res.status(400).json({ error: 'Категория с таким slug уже существует' });
    }
    
    const category = await Category.create({ name, slug, description, icon });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Ошибка создания категории' });
  }
});

// PUT /api/categories/:id - Обновить категорию (только админ)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, slug, description, icon } = req.body;
    
    const existing = await Category.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    // Проверяем уникальность slug
    if (slug && slug !== existing.slug) {
      const slugExists = await Category.getBySlug(slug);
      if (slugExists) {
        return res.status(400).json({ error: 'Категория с таким slug уже существует' });
      }
    }
    
    const category = await Category.update(req.params.id, { name, slug, description, icon });
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Ошибка обновления категории' });
  }
});

// DELETE /api/categories/:id - Удалить категорию (только админ)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const existing = await Category.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    await Category.delete(req.params.id);
    res.json({ message: 'Категория удалена успешно' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message || 'Ошибка удаления категории' });
  }
});

module.exports = router;