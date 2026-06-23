const multer = require('multer');
const path = require('path');
const os = require('os');

// Используем системную временную папку (на Render это /tmp)
const tempDir = os.tmpdir();
console.log('Upload directory configured to use temp dir:', tempDir);

// Настройка хранилища
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    // Генерируем уникальное имя без сторонних библиотек
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Недопустимый формат файла. Разрешены: JPG, PNG, GIF, WEBP, SVG'), false);
  }
};

// Создаем экземпляр multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Middleware для загрузки одного изображения
const uploadSingle = upload.single('image');

// Middleware для загрузки нескольких изображений
const uploadMultiple = upload.array('images', 10);

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadDir: tempDir // Оставил экспорт для совместимости, если он где-то используется
};