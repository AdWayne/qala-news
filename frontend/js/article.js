// Article Page
class ArticlePage {
  constructor() {
    this.articleId = this.getArticleId();
    this.init();
  }

  getArticleId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  async init() {
    if (!this.articleId) {
      document.getElementById("articleContent").innerHTML = `
        <div class="empty-state">
          <h2>Новость не найдена</h2>
          <p><a href="index.html">Вернуться на главную</a></p>
        </div>
      `;
      return;
    }

    await this.loadArticle();
    this.setupUserMenu();
    this.setupNavigation(); // Теперь этот вызов стоит после загрузки
  }

  async loadArticle() {
    const container = document.getElementById("articleContent");
    if (!container) return;

    try {
      const news = await api.getNewsById(this.articleId);
      if (news) {
        container.innerHTML = this.renderArticle(news);
        document.title = `${news.title} - Qala News`;
      } else {
        container.innerHTML = `<div class="empty-state"><h2>Новость не найдена</h2></div>`;
      }
    } catch (error) {
      console.error("Error loading article:", error);
      container.innerHTML = `<div class="empty-state"><h2>Ошибка загрузки</h2></div>`;
    }
  }

  renderArticle(news) {
    const categoryName = news.category_name || news.category || "Без категории";
    const date = new Date(news.created_at).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const tags = news.tags ? news.tags.split(",").map((t) => t.trim()) : [];

    let images = [];
    if (news.images) {
      images =
        typeof news.images === "string" ? JSON.parse(news.images) : news.images;
    }
    if (news.image_url && !images.includes(news.image_url)) {
      images.unshift(news.image_url);
    }

    const heroImage = images[0];
    const additionalImages = images.slice(1);

    return `
      <h1>${news.title}</h1>
      <div class="article-meta">
        <span>📅 ${date}</span>
        <span>📂 ${categoryName}</span>
        ${news.author_name ? `<span>✍️ ${news.author_name}</span>` : ""}
      </div>

      ${heroImage ? `<img src="${heroImage}" alt="${news.title}" class="article-hero">` : ""}
      
      <div class="article-content">
        ${
          news.content
            ? news.content
                .split("\n")
                .filter((p) => p.trim())
                .map((p) => `<p>${p}</p>`)
                .join("")
            : "<p>Содержание отсутствует</p>"
        }
      </div>

      ${
        additionalImages.length > 0
          ? `
        <div class="article-gallery" style="margin: 20px 0;">
          ${additionalImages.map((img) => `<img src="${img}" alt="Доп. фото" style="max-width: 100%; margin-bottom: 10px; display: block;">`).join("")}
        </div>
      `
          : ""
      }

      ${
        tags.length > 0
          ? `
        <div class="article-tags">
          ${tags.map((tag) => `<span>#${tag}</span>`).join("")}
        </div>
      `
          : ""
      }

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--line);">
        <a href="index.html" style="color: var(--brand); font-weight: 700;">← Назад к новостям</a>
      </div>
    `;
  }

  setupNavigation() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".main-nav");
    const search = document.querySelector(".search");

    if (toggle) {
      toggle.addEventListener("click", () => {
        const isOpen = nav.classList.contains("is-open");
        nav.classList.toggle("is-open");
        if (search) search.classList.toggle("is-open");
        toggle.textContent = isOpen ? "☰" : "✕";
        toggle.setAttribute("aria-expanded", !isOpen);
      });
    }
  }

  setupUserMenu() {
    const menu = document.getElementById("userMenu");
    const token = localStorage.getItem("token");
    if (!menu) return;

    if (token) {
      api.getCurrentUser().then((user) => {
        menu.innerHTML = `
          <span class="user-name">${user.username}</span>
          ${user.role === "admin" ? '<a href="admin.html">Админ</a>' : ""}
          <button id="logoutBtn">Выйти</button>
        `;
        document.getElementById("logoutBtn")?.addEventListener("click", () => {
          api.logout();
          window.location.href = "index.html";
        });
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.articlePage = new ArticlePage();
});
