const formatDate = (date) => new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
}).format(new Date(date));

const params = new URLSearchParams(window.location.search);

function setupNavigation() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  const search = document.querySelector('.search');
  const userMenu = document.querySelector('.user-menu');

  if (toggle && nav && search) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      search.classList.toggle('is-open', isOpen);
      if (userMenu) userMenu.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  const searchForm = document.querySelector('.search');
  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = document.querySelector('#searchInput').value.trim();
      window.location.href = value ? `index.html?search=${encodeURIComponent(value)}` : 'index.html';
    });
  }
}

async function setupUserMenu() {
  const root = document.querySelector('#userMenu');
  if (!root) return;

  const user = await window.newsApi.getCurrentUser();

  if (!user) {
    root.innerHTML = `
      <a class="login-link" href="login.html">Войти</a>
      <a class="register-link" href="register.html">Регистрация</a>
    `;
    return;
  }

  root.innerHTML = `
    <span>${user.name} · ${user.role === 'admin' ? 'Админ' : 'Пользователь'}</span>
    ${user.role === 'admin' ? '<a class="login-link" href="admin.html">Админка</a>' : ''}
    <button id="logoutButton" type="button">Выйти</button>
  `;

  document.querySelector('#logoutButton').addEventListener('click', async () => {
    await window.newsApi.logout();
    window.location.reload();
  });
}

function articleUrl(id) {
  return `article.html?id=${encodeURIComponent(id)}`;
}

function renderFeatured(article) {
  const root = document.querySelector('#featuredNews');
  if (!root) return;

  root.innerHTML = `
    <article class="featured-card">
      <a href="${articleUrl(article.id)}">
        <img src="${article.imageUrl}" alt="">
      </a>
      <div class="featured-content">
        <a class="category-pill" href="index.html?category=${encodeURIComponent(article.category)}">${article.category}</a>
        <h1 id="mainTitle"><a href="${articleUrl(article.id)}">${article.title}</a></h1>
        <p>${article.excerpt}</p>
        <time datetime="${article.date}">${formatDate(article.date)}</time>
      </div>
    </article>
  `;
}

function renderLatest(articles) {
  const root = document.querySelector('#latestNews');
  const count = document.querySelector('#latestCount');
  if (!root) return;

  count.textContent = `${articles.length} материалов`;
  root.innerHTML = articles.slice(0, 5).map((article) => `
    <article class="latest-item">
      <time datetime="${article.date}">${formatDate(article.date)}</time>
      <h3><a href="${articleUrl(article.id)}">${article.title}</a></h3>
    </article>
  `).join('');
}

function renderGrid(articles) {
  const root = document.querySelector('#newsGrid');
  if (!root) return;

  if (!articles.length) {
    root.innerHTML = '<p class="empty-state">Новости не найдены.</p>';
    return;
  }

  root.innerHTML = articles.map((article) => `
    <article class="news-card">
      <a href="${articleUrl(article.id)}" class="news-card-image">
        <img src="${article.imageUrl}" alt="">
      </a>
      <div class="news-card-body">
        <a class="category-pill" href="index.html?category=${encodeURIComponent(article.category)}">${article.category}</a>
        <h3><a href="${articleUrl(article.id)}">${article.title}</a></h3>
        <p>${article.excerpt}</p>
        <time datetime="${article.date}">${formatDate(article.date)}</time>
      </div>
    </article>
  `).join('');
}

async function initHomePage() {
  const grid = document.querySelector('#newsGrid');
  if (!grid) return;

  let articles = await window.newsApi.getPublishedArticles();
  const category = params.get('category');
  const search = params.get('search');

  if (category) {
    articles = articles.filter((article) => article.category === category);
  }

  if (search) {
    const query = search.toLowerCase();
    articles = articles.filter((article) => `${article.title} ${article.excerpt} ${article.content}`.toLowerCase().includes(query));
    const input = document.querySelector('#searchInput');
    if (input) input.value = search;
  }

  const featured = articles.find((article) => article.featured) || articles[0];
  if (featured) renderFeatured(featured);
  renderLatest(articles);
  renderGrid(articles.filter((article) => article.id !== featured?.id));
}

async function initArticlePage() {
  const root = document.querySelector('#articleRoot');
  if (!root) return;

  const article = await window.newsApi.getArticleById(params.get('id'));
  if (!article || article.status !== 'Опубликовано') {
    root.innerHTML = '<p class="empty-state">Статья не найдена или еще не опубликована.</p>';
    return;
  }

  document.title = `${article.title} - Qala News`;
  root.innerHTML = `
    <a class="category-pill" href="index.html?category=${encodeURIComponent(article.category)}">${article.category}</a>
    <h1>${article.title}</h1>
    <div class="article-meta">
      <span>${article.author}</span>
      <time datetime="${article.date}">${formatDate(article.date)}</time>
    </div>
    <img class="article-hero" src="${article.imageUrl}" alt="">
    <div class="article-content">
      ${article.content.split('\n').filter(Boolean).map((paragraph) => `<p>${paragraph}</p>`).join('')}
    </div>
    <footer class="article-tags">
      ${article.tags.map((tag) => `<span>#${tag}</span>`).join('')}
    </footer>
  `;
}

setupNavigation();
setupUserMenu();
initHomePage();
initArticlePage();
