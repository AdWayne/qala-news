// Main App
class NewsApp {
  constructor() {
    this.currentCategory = this.getCategoryFromURL();
    this.currentPage = 1;
    this.pageSize = 6;
    this.searchQuery = "";
    this.totalPages = 0;
    this.news = [];

    this.init();
  }

  getCategoryFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("category") || null;
  }

  async init() {
    this.setupNavigation();
    this.setupSearch();
    this.setupUserMenu();
    this.loadFeaturedNews();
    this.loadLatestNews();
    this.loadNews();
    this.highlightActiveCategory();
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

    document.querySelectorAll(".main-nav a").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const category = link.dataset.category;
        if (category === "Все") {
          window.location.href = "index.html";
        } else {
          window.location.href = `index.html?category=${encodeURIComponent(category)}`;
        }
      });
    });
  }

  setupSearch() {
    const form = document.getElementById("searchForm");
    const input = document.getElementById("searchInput");

    if (form && input) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = input.value.trim();
        if (query) {
          this.searchQuery = query;
          this.currentPage = 1;
          this.loadNews();
        }
      });
    }
  }

  setupUserMenu() {
    const menu = document.getElementById("userMenu");
    const token = localStorage.getItem("token");

    if (!menu) return;

    if (token) {
      api
        .getCurrentUser()
        .then((user) => {
          menu.innerHTML = `
            <span class="user-name">${user.username}</span>
            ${user.role === "admin" ? '<a href="admin.html" class="admin-link">Админ</a>' : ""}
            <button id="logoutBtn" class="logout-btn">Выйти</button>
          `;
          document
            .getElementById("logoutBtn")
            ?.addEventListener("click", () => {
              api.logout();
              window.location.reload();
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

  highlightActiveCategory() {
    const links = document.querySelectorAll(".main-nav a");
    links.forEach((link) => {
      link.classList.remove("active");
      if (
        this.currentCategory &&
        link.dataset.category === this.currentCategory
      ) {
        link.classList.add("active");
      }
      if (!this.currentCategory && link.dataset.category === "Все") {
        link.classList.add("active");
      }
    });
  }

  async loadFeaturedNews() {
    const container = document.getElementById("featuredNews");
    if (!container) return;

    try {
      const news = await api.getFeaturedNews();
      if (news) {
        container.innerHTML = this.renderFeaturedCard(news);
        container
          .querySelector(".featured-card")
          ?.addEventListener("click", () => {
            window.location.href = `article.html?id=${news.id}`;
          });
      } else {
        container.innerHTML =
          '<div class="empty-state">Нет главной новости</div>';
      }
    } catch (error) {
      console.error("Error loading featured news:", error);
      container.innerHTML =
        '<div class="empty-state">Не удалось загрузить главную новость</div>';
    }
  }

  async loadLatestNews() {
    const container = document.getElementById("latestNews");
    const count = document.getElementById("latestCount");
    if (!container) return;

    try {
      const news = await api.getLatestNews(5);
      if (news && news.length > 0) {
        container.innerHTML = news
          .map((item) => this.renderLatestItem(item))
          .join("");
        container.querySelectorAll(".latest-item").forEach((el, index) => {
          el.addEventListener("click", () => {
            window.location.href = `article.html?id=${news[index].id}`;
          });
        });
        if (count) count.textContent = `(${news.length})`;
      } else {
        container.innerHTML = '<div class="empty-state">Нет новостей</div>';
      }
    } catch (error) {
      console.error("Error loading latest news:", error);
      container.innerHTML =
        '<div class="empty-state">Не удалось загрузить последние новости</div>';
    }
  }

  async loadNews() {
    const container = document.getElementById("newsGrid");
    const pagination = document.getElementById("pagination");
    if (!container) return;

    try {
      const offset = (this.currentPage - 1) * this.pageSize;
      const result = await api.getNews({
        limit: this.pageSize,
        offset: offset,
        category: this.currentCategory,
        search: this.searchQuery || undefined,
      });

      this.news = result.news;
      this.totalPages = result.pagination?.totalPages || 0;

      if (this.news && this.news.length > 0) {
        container.innerHTML = this.news
          .map((item) => this.renderNewsCard(item))
          .join("");
        container.querySelectorAll(".news-card").forEach((el, index) => {
          el.addEventListener("click", (e) => {
            if (e.target.closest(".admin-actions-card")) return;
            window.location.href = `article.html?id=${this.news[index].id}`;
          });
        });

        // Добавляем обработчики для кнопок админа
        this.setupAdminButtons();
      } else {
        container.innerHTML =
          '<div class="empty-state">Новостей не найдено</div>';
      }

      this.renderPagination(pagination);
    } catch (error) {
      console.error("Error loading news:", error);
      container.innerHTML =
        '<div class="empty-state">Не удалось загрузить новости</div>';
    }
  }

  // Добавляем обработчики для кнопок админа на главной странице
  setupAdminButtons() {
    // Кнопки редактирования
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        // Перенаправляем в админку с ID новости для редактирования
        window.location.href = `admin.html?edit=${id}`;
      });
    });

    // Кнопки удаления
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        if (confirm("Вы уверены, что хотите удалить эту новость?")) {
          this.deleteNews(id);
        }
      });
    });
  }

  // Метод для удаления новости с главной страницы
  async deleteNews(id) {
    try {
      await api.deleteNews(id);
      // Перезагружаем новости
      this.loadNews();
      this.loadLatestNews();
      this.loadFeaturedNews();
      alert("Новость удалена!");
    } catch (error) {
      console.error("Error deleting news:", error);
      alert("Ошибка удаления новости: " + error.message);
    }
  }

  renderPagination(container) {
    if (!container) return;

    if (this.totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    let html = "";
    for (let i = 1; i <= this.totalPages; i++) {
      html += `<button class="${i === this.currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
    }

    container.innerHTML = html;
    container.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.currentPage = parseInt(btn.dataset.page);
        this.loadNews();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  renderFeaturedCard(news) {
    const categoryName = news.category_name || news.category || "Без категории";
    // Получаем правильный URL изображения
    const image = this.getImageUrl(news);
    const date = new Date(news.created_at).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `
      <div class="featured-card">
        <img src="${image}" alt="${news.title}" loading="lazy" onerror="this.src='https://picsum.photos/seed/error/800/600'">
        <div class="featured-content">
          <div class="category-pill">${categoryName}</div>
          <h1>${news.title}</h1>
          <p>${news.excerpt || news.content?.substring(0, 150) + "..." || ""}</p>
          <time datetime="${news.created_at}">${date}</time>
          ${news.author_name ? `<span style="color: var(--muted); margin-left: 12px;">✍️ ${news.author_name}</span>` : ""}
        </div>
      </div>
    `;
  }

  renderLatestItem(news) {
    const categoryName = news.category_name || news.category || "Без категории";
    const date = new Date(news.created_at).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });

    return `
      <div class="latest-item">
        <span class="category-pill" style="font-size: 11px;">${categoryName}</span>
        <h3>${news.title}</h3>
        <time datetime="${news.created_at}">${date}</time>
      </div>
    `;
  }

  // Метод для получения правильного URL изображения
  // Метод для получения правильного URL изображения
  getImageUrl(news) {
    console.log("🔍 Getting image for news:", news.id, news.title);

    // Если есть image_url - используем его
    if (news.image_url) {
      console.log("✅ Using image_url:", news.image_url);
      return news.image_url;
    }

    // Если есть массив images - берем первое
    if (news.images) {
      try {
        let images = news.images;
        // Если это строка JSON, парсим
        if (typeof images === "string") {
          images = JSON.parse(images);
        }
        if (Array.isArray(images) && images.length > 0) {
          console.log("✅ Using first image from array:", images[0]);
          return images[0];
        }
      } catch (e) {
        console.warn("⚠️ Error parsing images:", e);
      }
    }

    // Если нет изображений - используем заглушку
    console.log("⚠️ No images found, using placeholder");
    return `https://picsum.photos/seed/${news.id || "default"}/800/600`;
  }

  renderNewsCard(news) {
    const categoryName = news.category_name || news.category || "Без категории";
    const image = this.getImageUrl(news);
    const date = new Date(news.created_at).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // Проверяем, является ли пользователь админом
    const isAdmin = (() => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return false;
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.role === "admin";
      } catch {
        return false;
      }
    })();

    // Показываем кнопки только для админа
    let adminActions = "";
    if (isAdmin) {
      adminActions = `
        <div class="admin-actions-card" style="margin-top: 10px; display: flex; gap: 8px;">
          <button class="edit-btn" data-id="${news.id}" style="padding: 4px 12px; font-size: 12px; border-radius: 4px; border: 1px solid var(--line); background: var(--brand); color: white; cursor: pointer;">✏️ Редактировать</button>
          <button class="delete-btn" data-id="${news.id}" style="padding: 4px 12px; font-size: 12px; border-radius: 4px; border: none; background: var(--danger); color: white; cursor: pointer;">🗑️ Удалить</button>
        </div>
      `;
    }

    return `
      <article class="news-card">
        <div class="news-card-image" style="position:relative;">
          <img src="${image}" alt="${news.title}" loading="lazy" onerror="this.src='https://picsum.photos/seed/error${news.id}/800/600'">
          ${news.is_featured ? '<span style="position:absolute;top:10px;right:10px;background:var(--accent);padding:4px 12px;border-radius:4px;font-weight:700;font-size:12px;color:#000;">⭐ Главная</span>' : ""}
        </div>
        <div class="news-card-body">
          <div class="category-pill">${categoryName}</div>
          <h3>${news.title}</h3>
          <p>${news.excerpt || news.content?.substring(0, 120) + "..." || ""}</p>
          <time datetime="${news.created_at}">${date}</time>
          ${news.author_name ? `<span style="color: var(--muted); font-size: 13px;">✍️ ${news.author_name}</span>` : ""}
          ${adminActions}
        </div>
      </article>
    `;
  }
}

// Запускаем приложение
document.addEventListener("DOMContentLoaded", () => {
  window.app = new NewsApp();
});
