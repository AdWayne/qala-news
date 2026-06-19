// Article Page
class ArticlePage {
  constructor() {
    this.articleId = this.getArticleId();
    this.init();
  }

  getArticleId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  async init() {
    if (!this.articleId) {
      document.getElementById('articleContent').innerHTML = `
        <div class="empty-state">
          <h2>Новость не найдена</h2>
          <p><a href="index.html">Вернуться на главную</a></p>
        </div>
      `;
      return;
    }

    await this.loadArticle();
    this.setupUserMenu();
    this.setupNavigation();
  }

  async loadArticle() {
    const container = document.getElementById('articleContent');
    if (!container) return;

    try {
      const news = await api.getNewsById(this.articleId);
      if (news) {
        container.innerHTML = this.renderArticle(news);
        document.title = `${news.title} - Qala News`;
      } else {
        container.innerHTML = `
          <div class="empty-state">
            <h2>Новость не найдена</h2>
            <p><a href="index.html">Вернуться на главную</a></p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading article:', error);
      container.innerHTML = `
        <div class="empty-state">
          <h2>Ошибка загрузки</h2>
          <p>${error.message}</p>
          <p><a href="index.html">Вернуться на главную</a></p>
        </div>
      `;
    }
  }

  renderArticle(news) {
    const categoryName = news.category_name || news.category || 'Без категории';
    const image = news.image_url || 'https://picsum.photos/seed/${news.id}/1200/600';
    const date = new Date(news.created_at).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    
    const tags = news.tags ? news.tags.split(',').map(t => t.trim()) : [];
    
    // Показываем все изображения
    let imagesHtml = '';
    if (news.images && news.images.length > 0) {
      const images = typeof news.images === 'string' ? JSON.parse(news.images) : news.images;
      imagesHtml = images.map(img => 
        `<img src="${img}" alt="${news.title}" class="article-hero" style="margin-bottom: 10px;">`
      ).join('');
    }
    
    return `
      <h1>${news.title}</h1>
      <div class="article-meta">
        <span>📅 ${date}</span>
        <span>📂 ${categoryName}</span>
        ${news.author_name ? `<span>✍️ ${news.author_name}</span>` : ''}
        <span>👁️ ${news.views || 0} просмотров</span>
      </div>
      ${image ? `<img src="${image}" alt="${news.title}" class="article-hero">` : ''}
      ${imagesHtml}
      <div class="article-content">
        ${news.content ? news.content.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('') : '<p>Содержание отсутствует</p>'}
      </div>
      ${tags.length > 0 ? `
        <div class="article-tags">
          ${tags.map(tag => `<span>#${tag}</span>`).join('')}
        </div>
      ` : ''}
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--line);">
        <a href="index.html" style="color: var(--brand); font-weight: 700;">← Назад к новостям</a>
      </div>
    `;
  }

  setupNavigation() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');
    const search = document.querySelector('.search');
    
    if (toggle) {
      toggle.addEventListener('click', () => {
        const isOpen = nav.classList.contains('is-open');
        nav.classList.toggle('is-open');
        if (search) search.classList.toggle('is-open');
        toggle.textContent = isOpen ? '☰' : '✕';
        toggle.setAttribute('aria-expanded', !isOpen);
      });
    }
  }

  setupUserMenu() {
    const menu = document.getElementById('userMenu');
    const token = localStorage.getItem('token');
    
    if (!menu) return;

    if (token) {
      api.getCurrentUser()
        .then(user => {
          menu.innerHTML = `
            <span class="user-name">👤 ${user.username}</span>
            ${user.role === 'admin' ? '<a href="admin.html" class="admin-link">⚙️ Админ</a>' : ''}
            <button id="logoutBtn" class="logout-btn">Выйти</button>
          `;
          document.getElementById('logoutBtn')?.addEventListener('click', () => {
            api.logout();
            window.location.href = 'index.html';
          });
        })
        .catch(() => {
          this.showAuthButtons(menu);
        });
    } else {
      this.showAuthButtons(menu);
    }
  }

  showAuthButtons(menu) {
    menu.innerHTML = `
      <a href="auth.html" class="login-link">Войти</a>
      <a href="auth.html" class="register-link">Регистрация</a>
    `;
  }
}

// Запускаем
document.addEventListener('DOMContentLoaded', () => {
  window.articlePage = new ArticlePage();
});