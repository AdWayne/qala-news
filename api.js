(function () {
  const DB_NAME = 'qala_news_db';
  const DB_VERSION = 1;
  const ARTICLE_STORE = 'articles';
  const USER_STORE = 'users';
  const SESSION_KEY = 'qala_news_session';

  const seedArticles = [
    {
      id: 1,
      title: 'Президент провел совещание по развитию регионов',
      excerpt: 'В Астане обсудили инфраструктурные проекты, поддержку бизнеса и новые меры для повышения качества городской среды.',
      content: 'В Астане прошло расширенное совещание, посвященное развитию регионов и модернизации городской инфраструктуры. Участники обсудили строительство социальных объектов, обновление транспортных коридоров и запуск программ поддержки малого бизнеса.\n\nОтдельное внимание уделили прозрачности бюджетного планирования и срокам реализации проектов. По итогам встречи профильным ведомствам поручено подготовить обновленный график работ и представить промежуточные результаты до конца квартала.',
      category: 'Политика',
      imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      author: 'Редакция Qala News',
      date: '2026-06-11',
      status: 'Опубликовано',
      tags: ['Политика', 'Регионы', 'Астана'],
      featured: true
    },
    {
      id: 2,
      title: 'Курс тенге укрепился после торговой сессии',
      excerpt: 'Экономисты связывают динамику с ростом экспортной выручки и снижением внешнего давления на развивающиеся рынки.',
      content: 'На валютном рынке Казахстана зафиксировано укрепление тенге по итогам дневной торговой сессии. Аналитики отмечают, что движение поддержали стабильные цены на сырьевые товары и повышение активности экспортеров.\n\nФинансовые консультанты рекомендуют бизнесу сохранять консервативный подход к валютным рискам, поскольку внешние рынки остаются чувствительными к решениям мировых центробанков.',
      category: 'Экономика',
      imageUrl: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
      author: 'Алия Нурбек',
      date: '2026-06-10',
      status: 'Опубликовано',
      tags: ['Экономика', 'Тенге', 'Рынки'],
      featured: false
    },
    {
      id: 3,
      title: 'Национальная сборная готовится к решающему матчу',
      excerpt: 'Тренерский штаб сделал акцент на восстановлении игроков и тактической работе перед домашней игрой.',
      content: 'Национальная сборная провела открытую тренировку перед важным матчем квалификационного цикла. По словам тренерского штаба, команда работает над быстрым переходом из обороны в атаку и стандартными положениями.\n\nБолельщиков ожидают усиленные меры организации у стадиона, а городские службы рекомендуют заранее планировать маршрут к арене.',
      category: 'Спорт',
      imageUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
      author: 'Данияр Сагындыков',
      date: '2026-06-09',
      status: 'Опубликовано',
      tags: ['Спорт', 'Футбол', 'Сборная'],
      featured: false
    },
    {
      id: 4,
      title: 'В Алматы откроют новый общественный парк',
      excerpt: 'Проект включает пешеходные маршруты, спортивные зоны и площадки для семейного отдыха.',
      content: 'В Алматы завершается благоустройство нового общественного парка. Территория будет включать велодорожки, зоны тихого отдыха, современные детские площадки и пространства для занятий спортом.\n\nГородские власти отмечают, что при проектировании учитывались предложения жителей ближайших районов. Открытие парка запланировано после завершения озеленения и установки освещения.',
      category: 'Политика',
      imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80',
      author: 'Редакция Qala News',
      date: '2026-06-08',
      status: 'Черновик',
      tags: ['Алматы', 'Город', 'Парк'],
      featured: false
    }
  ];

  const seedUsers = [
    {
      id: 1,
      name: 'Администратор',
      email: 'admin@qala.news',
      password: 'admin123',
      role: 'admin',
      createdAt: '2026-06-11'
    },
    {
      id: 2,
      name: 'Читатель',
      email: 'user@qala.news',
      password: 'user123',
      role: 'user',
      createdAt: '2026-06-11'
    }
  ];

  let dbPromise;

  const clone = (value) => JSON.parse(JSON.stringify(value));

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  function openDb() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(ARTICLE_STORE)) {
          const articleStore = db.createObjectStore(ARTICLE_STORE, { keyPath: 'id' });
          articleStore.createIndex('date', 'date');
          articleStore.createIndex('status', 'status');
          seedArticles.forEach((article) => articleStore.put(article));
        }

        if (!db.objectStoreNames.contains(USER_STORE)) {
          const userStore = db.createObjectStore(USER_STORE, { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
          userStore.createIndex('role', 'role');
          seedUsers.forEach((user) => userStore.put(user));
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return dbPromise;
  }

  async function getAll(storeName) {
    const db = await openDb();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    return clone(await requestToPromise(store.getAll()));
  }

  async function getOne(storeName, id) {
    const db = await openDb();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const item = await requestToPromise(store.get(Number(id)));
    return item ? clone(item) : null;
  }

  async function putOne(storeName, value) {
    const db = await openDb();
    const transaction = db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).put(clone(value));
    await transactionDone(transaction);
    return clone(value);
  }

  async function deleteOne(storeName, id) {
    const db = await openDb();
    const transaction = db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).delete(Number(id));
    await transactionDone(transaction);
    return { success: true };
  }

  function normalizePayload(payload) {
    return {
      title: payload.title.trim(),
      excerpt: payload.excerpt.trim(),
      content: payload.content.trim(),
      category: payload.category,
      imageUrl: payload.imageUrl.trim(),
      author: payload.author || 'Редакция Qala News',
      date: payload.date || new Date().toISOString().slice(0, 10),
      status: payload.status || 'Опубликовано',
      tags: Array.isArray(payload.tags)
        ? payload.tags
        : String(payload.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
      featured: Boolean(payload.featured)
    };
  }

  async function nextId(storeName) {
    const rows = await getAll(storeName);
    return rows.length ? Math.max(...rows.map((row) => Number(row.id))) + 1 : 1;
  }

  async function findUserByEmail(email) {
    const db = await openDb();
    const transaction = db.transaction(USER_STORE, 'readonly');
    const store = transaction.objectStore(USER_STORE);
    const index = store.index('email');
    const user = await requestToPromise(index.get(email.trim().toLowerCase()));
    return user ? clone(user) : null;
  }

  function publicUser(user) {
    if (!user) return null;
    const { password, ...safeUser } = user;
    return clone(safeUser);
  }

  function setSession(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(publicUser(user)));
  }

  function getSession() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function requireAdmin() {
    const user = getSession();
    if (!user || user.role !== 'admin') {
      throw new Error('Доступ запрещен: требуется роль администратора.');
    }
  }

  window.newsApi = {
    async getArticles() {
      const articles = await getAll(ARTICLE_STORE);
      return articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    async getPublishedArticles() {
      const articles = await this.getArticles();
      return articles.filter((article) => article.status === 'Опубликовано');
    },

    async getArticleById(id) {
      return getOne(ARTICLE_STORE, id);
    },

    async createArticle(payload) {
      requireAdmin();
      const article = { id: await nextId(ARTICLE_STORE), ...normalizePayload(payload) };
      return putOne(ARTICLE_STORE, article);
    },

    async updateArticle(id, payload) {
      requireAdmin();
      const existing = await getOne(ARTICLE_STORE, id);
      if (!existing) return null;
      const article = { ...existing, ...normalizePayload(payload), id: Number(id) };
      return putOne(ARTICLE_STORE, article);
    },

    async deleteArticle(id) {
      requireAdmin();
      return deleteOne(ARTICLE_STORE, id);
    },

    async register({ name, email, password }) {
      const cleanEmail = email.trim().toLowerCase();
      if (await findUserByEmail(cleanEmail)) {
        throw new Error('Пользователь с таким email уже существует.');
      }

      const user = {
        id: await nextId(USER_STORE),
        name: name.trim(),
        email: cleanEmail,
        password,
        role: 'user',
        createdAt: new Date().toISOString().slice(0, 10)
      };

      await putOne(USER_STORE, user);
      setSession(user);
      return publicUser(user);
    },

    async login({ email, password }) {
      const user = await findUserByEmail(email);
      if (!user || user.password !== password) {
        throw new Error('Неверный email или пароль.');
      }

      setSession(user);
      return publicUser(user);
    },

    async logout() {
      sessionStorage.removeItem(SESSION_KEY);
      return { success: true };
    },

    async getCurrentUser() {
      await openDb();
      return getSession();
    },

    async isAdmin() {
      const user = await this.getCurrentUser();
      return Boolean(user && user.role === 'admin');
    }
  };
})();
