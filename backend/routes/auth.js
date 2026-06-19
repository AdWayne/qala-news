const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { authenticate } = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET || "qala_news_secret_key_2026";

// Регистрация
// Регистрация
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Проверка обязательных полей
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Все поля обязательны" });
    }

    // Проверка длины пароля
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Пароль должен быть не менее 6 символов" });
    }

    // Проверка, существует ли пользователь
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Пользователь с таким именем уже существует" });
    }

    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res
        .status(400)
        .json({ error: "Пользователь с таким email уже существует" });
    }

    // Создаем пользователя
    const user = await User.create({ username, email, password });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "qala_news_secret_key_2026",
      { expiresIn: "7d" },
    );

    // ✅ Возвращаем токен вместе с данными пользователя
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Ошибка регистрации" });
  }
});

// Вход
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Имя пользователя и пароль обязательны" });
    }

    // Ищем пользователя
    const user = await User.findByUsername(username);
    if (!user) {
      return res
        .status(401)
        .json({ error: "Неверное имя пользователя или пароль" });
    }

    // Проверяем пароль
    const isPasswordValid = await User.comparePassword(
      password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ error: "Неверное имя пользователя или пароль" });
    }

    // Создаем токен
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Ошибка входа" });
  }
});

// Получение текущего пользователя
router.get("/me", authenticate, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: "Ошибка получения данных пользователя" });
  }
});

// Выход (на клиенте удаляется токен)
router.post("/logout", authenticate, (req, res) => {
  res.json({ message: "Выход выполнен успешно" });
});

module.exports = router;
