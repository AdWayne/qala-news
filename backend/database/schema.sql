CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category_id INTEGER REFERENCES categories(id),
    category_name TEXT,
    image_url TEXT,
    images JSONB,
    tags TEXT,
    author_id INTEGER REFERENCES users(id),
    views INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Таблица пользователей


CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица категорий
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица новостей
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category_id INTEGER,
  category_name TEXT,
  image_url TEXT,
  images TEXT, -- JSON массив путей к изображениям
  tags TEXT,
  author_id INTEGER,
  views INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_news_category_id ON news(category_id);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at);
CREATE INDEX IF NOT EXISTS idx_news_is_featured ON news(is_featured);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Вставляем начальные категории
INSERT OR IGNORE INTO categories (name, slug, description, icon) VALUES
('Политика', 'politika', 'Новости политики Казахстана', '🏛️'),
('Экономика', 'ekonomika', 'Экономические новости', '💰'),
('Спорт', 'sport', 'Спортивные новости', '⚽'),
('Культура', 'kultura', 'Новости культуры', '🎭'),
('Технологии', 'tehnologii', 'Технологические новости', '💻'),
('Общество', 'obschestvo', 'Новости общества', '👥'),
('Происшествия', 'proisshestviya', 'ЧП и происшествия', '🚨');

-- Создаем администратора (пароль: admin123)
INSERT OR IGNORE INTO users (username, password_hash, email, role) VALUES
('admin', '$2a$12$2gAUK91lMmQ/IkqjqyBxcObzR7aeQ503RV0kcg5LTSsOswkikRngS', 'admin@qala-news.com', 'admin');

-- Добавляем тестовые новости с категориями
INSERT OR IGNORE INTO news (title, content, excerpt, category_id, category_name, image_url, tags, is_featured) VALUES
('Казахстан и Китай укрепляют экономическое сотрудничество', 
 'В Астане состоялась встреча представителей деловых кругов Казахстана и Китая. Стороны обсудили перспективы сотрудничества в области торговли, инвестиций и технологий. Подписано несколько важных соглашений, которые дадут новый импульс развитию экономических отношений между двумя странами.', 
 'Казахстан и Китай подписали новый пакет соглашений о сотрудничестве в области экономики, торговли и технологий.', 
 (SELECT id FROM categories WHERE slug = 'ekonomika'),
 'Экономика',
 'https://picsum.photos/seed/kazakhstan/800/600', 
 'экономика,сотрудничество,китай,инвестиции', 
 1),

('Казахстанские теннисисты вышли в финал международного турнира', 
 'Сборная Казахстана по теннису показала впечатляющие результаты на международном турнире в Дубае. В полуфинале наши спортсмены обыграли команду Испании со счетом 3:2 и вышли в финал, где встретятся с действующими чемпионами из США.', 
 'Казахстанские теннисисты впервые за 10 лет вышли в финал международного турнира, обыграв команду Испании.', 
 (SELECT id FROM categories WHERE slug = 'sport'),
 'Спорт',
 'https://picsum.photos/seed/tennis/800/600', 
 'теннис,спорт,турнир', 
 0),

('Цифровизация образования: новые стандарты в Казахстане', 
 'Министерство образования Казахстана представило новую стратегию цифровизации школ и вузов. Планируется оснастить все учебные заведения современным оборудованием, внедрить электронные учебники и системы дистанционного обучения.', 
 'В Казахстане стартует масштабная программа цифровизации образования с бюджетом 200 млрд тенге.', 
 (SELECT id FROM categories WHERE slug = 'tehnologii'),
 'Технологии',
 'https://picsum.photos/seed/education/800/600', 
 'образование,цифровизация,технологии', 
 0);