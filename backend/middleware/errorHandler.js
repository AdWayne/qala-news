const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Ошибки валидации
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  // Ошибки базы данных
  if (err.code && err.code.startsWith('SQLITE_')) {
    return res.status(500).json({ error: 'Ошибка базы данных' });
  }
  
  // По умолчанию
  res.status(500).json({ 
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;