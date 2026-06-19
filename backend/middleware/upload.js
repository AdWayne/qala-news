const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Создаем папку для загрузок, если её нет
const uploadDir = path.join(__dirname, '../../frontend/uploads');
console.log('Upload directory:', uploadDir);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Upload directory created');
}

// Настройка хранилища
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
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
  uploadDir
};