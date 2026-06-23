// Admin Page
class AdminPage {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 6;
    this.totalPages = 0;
    this.editingId = null;
    this.categories = [];
    this.uploadedImages = [];

    this.init();
  }

  async init() {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "auth.html";
      return;
    }

    try {
      const user = await api.getCurrentUser();
      if (user.role !== "admin") {
        window.location.href = "index.html";
        return;
      }

      this.user = user;
      this.setupUI();
      this.loadCategories();
      this.loadStats();
      this.loadNews();
      this.setupUserMenu();
    } catch (error) {
      console.error("Init error:", error);
      window.location.href = "auth.html";
    }
  }

  setupUI() {
    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      api.logout();
      window.location.href = "index.html";
    });

    document.getElementById("createNewsBtn")?.addEventListener("click", () => {
      this.openNewsModal();
    });

    document
      .getElementById("manageCategoriesBtn")
      ?.addEventListener("click", () => {
        this.openCategoryModal();
      });

    // Модальное окно новостей
    document
      .querySelector("#newsModal .modal-close")
      ?.addEventListener("click", () => {
        this.closeNewsModal();
      });

    document.getElementById("cancelBtn")?.addEventListener("click", () => {
      this.closeNewsModal();
    });

    document.getElementById("newsModal")?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        this.closeNewsModal();
      }
    });

    // Модальное окно категорий
    document
      .getElementById("categoryModalClose")
      ?.addEventListener("click", () => {
        this.closeCategoryModal();
      });

    document.getElementById("categoryModal")?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        this.closeCategoryModal();
      }
    });

    // Форма новостей
    document.getElementById("newsForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveNews();
    });

    // Форма категорий
    document.getElementById("categoryForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveCategory();
    });

    // Предпросмотр изображений
    document.getElementById("newsImages")?.addEventListener("change", (e) => {
      this.previewImages(e.target.files);
    });
  }

  setupUserMenu() {
    const menu = document.getElementById("userMenu");
    if (!menu) return;

    menu.innerHTML = `
      <span class="user-name">${this.user.username}</span>
      <button id="logoutBtnHeader" class="logout-btn">Выйти</button>
    `;

    document
      .getElementById("logoutBtnHeader")
      ?.addEventListener("click", () => {
        api.logout();
        window.location.href = "index.html";
      });
  }

  async loadCategories() {
    try {
      this.categories = await api.getCategories();
      const select = document.getElementById("newsCategory");
      if (select) {
        select.innerHTML = '<option value="">Выберите категорию</option>';
        this.categories.forEach((cat) => {
          const option = document.createElement("option");
          option.value = cat.id;
          option.textContent = `${cat.icon || "📁"} ${cat.name}`;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }

  async loadStats() {
    try {
      const stats = await api.getStats();
      document.getElementById("totalNews").textContent = stats.totalNews || 0;
      document.getElementById("totalUsers").textContent = stats.totalUsers || 0;
      document.getElementById("categoriesCount").textContent =
        stats.categories?.length || 0;
    } catch (error) {
      console.error("Error loading stats:", error);
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
      });

      this.totalPages = result.pagination?.totalPages || 0;

      if (result.news && result.news.length > 0) {
        container.innerHTML = result.news
          .map((item) => this.renderAdminCard(item))
          .join("");
        this.setupAdminActions();
      } else {
        container.innerHTML = '<div class="empty-state">Нет новостей</div>';
      }

      this.renderPagination(pagination);
    } catch (error) {
      console.error("Error loading news:", error);
      container.innerHTML =
        '<div class="empty-state">Не удалось загрузить новости</div>';
    }
  }

  renderAdminCard(news) {
    const image =
      news.image_url || `https://picsum.photos/seed/${news.id}/800/600`;
    const date = new Date(news.created_at).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    let imagesCount = 0;
    if (news.images) {
      try {
        imagesCount =
          typeof news.images === "string"
            ? JSON.parse(news.images).length
            : news.images.length;
      } catch (e) {
        imagesCount = 0;
      }
    }

    // Добавляем стиль для рамки, если новость главная
    const cardStyle = news.is_featured ? "border: 2px solid gold;" : "";

    return `
      <article class="news-card" style="${cardStyle}">
        <div class="news-card-image" style="position:relative;">
          <img src="${image}" alt="${news.title}" loading="lazy">
          
          ${news.is_featured ? '<span style="position:absolute;top:10px;left:10px;background:gold;padding:4px 8px;border-radius:4px;font-weight:bold;font-size:12px;">ГЛАВНАЯ</span>' : ""}
          
          ${imagesCount > 0 ? `<span style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,0.7);padding:4px 8px;border-radius:4px;color:white;font-size:12px;">📷 ${imagesCount}</span>` : ""}
        </div>
        <div class="news-card-body">
          <div class="category-pill">${news.category_name || news.category || "Без категории"}</div>
          <h3>${news.title}</h3>
          <p>${news.excerpt || (news.content ? news.content.substring(0, 120) + "..." : "")}</p>
          <time datetime="${news.created_at}">${date}</time>
          <div class="admin-actions-card" style="margin-top: 10px; display: flex; gap: 8px;">
            <button class="edit-btn primary-button" data-id="${news.id}" style="padding: 6px 12px; font-size: 13px;">Редактировать</button>
            <button class="delete-btn secondary-button" data-id="${news.id}" style="padding: 6px 12px; font-size: 13px; background: var(--danger); color: white; border: none;">Удалить</button>
          </div>
        </div>
      </article>
    `;
  }

  setupAdminActions() {
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        this.editNews(id);
      });
    });

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

  async editNews(id) {
    try {
      const news = await api.getNewsById(id);
      if (news) {
        this.editingId = id;
        this.openNewsModal(news);
      }
    } catch (error) {
      console.error("Error editing news:", error);
      alert("Ошибка загрузки новости: " + error.message);
    }
  }

  async deleteNews(id) {
    try {
      await api.deleteNews(id);
      this.loadNews();
      this.loadStats();
    } catch (error) {
      console.error("Error deleting news:", error);
      alert("Ошибка удаления новости: " + error.message);
    }
  }

  previewImages(files) {
    const container = document.getElementById("imagePreview");
    if (!container) return;
    container.innerHTML = "";

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.width = "100px";
        img.style.height = "100px";
        img.style.objectFit = "cover";
        img.style.margin = "5px";
        img.style.borderRadius = "4px";
        img.style.border = "1px solid var(--line)";
        container.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }

  openNewsModal(news = null) {
    const modal = document.getElementById("newsModal");
    const title = document.getElementById("modalTitle");
    const form = document.getElementById("newsForm");
    const preview = document.getElementById("imagePreview");

    if (!modal || !form) return;

    preview.innerHTML = "";
    form.reset();

    if (news) {
      title.textContent = "Редактировать новость";
      document.getElementById("newsTitle").value = news.title || "";
      document.getElementById("newsCategory").value = news.category_id || "";
      document.getElementById("newsContent").value = news.content || "";
      document.getElementById("newsExcerpt").value = news.excerpt || "";
      document.getElementById("newsTags").value = news.tags || "";
      document.getElementById("newsFeatured").checked =
        news.is_featured === 1 || news.is_featured === true;

      // Показываем существующие изображения
      let images = [];
      try {
        images =
          typeof news.images === "string"
            ? JSON.parse(news.images)
            : news.images || [];
      } catch (e) {
        images = [];
      }

      if (images.length > 0) {
        images.forEach((img) => {
          const imgEl = document.createElement("img");
          imgEl.src = img;
          imgEl.style.width = "100px";
          imgEl.style.height = "100px";
          imgEl.style.objectFit = "cover";
          imgEl.style.margin = "5px";
          imgEl.style.borderRadius = "4px";
          imgEl.style.border = "1px solid var(--line)";
          preview.appendChild(imgEl);
        });
      }
    } else {
      title.textContent = "Создать новость";
      this.editingId = null;
      document.getElementById("newsFeatured").checked = false;
    }

    modal.style.display = "flex";
  }

  closeNewsModal() {
    const modal = document.getElementById("newsModal");
    if (modal) modal.style.display = "none";
    const form = document.getElementById("newsForm");
    if (form) form.reset();
    const preview = document.getElementById("imagePreview");
    if (preview) preview.innerHTML = "";
    this.editingId = null;
  }

  async saveNews() {
    try {
      const form = document.getElementById("newsForm");
      const formData = new FormData();

      // Добавляем все поля в FormData вручную
      const title = document.getElementById("newsTitle").value.trim();
      const category_id = document.getElementById("newsCategory").value;
      const content = document.getElementById("newsContent").value.trim();
      const excerpt = document.getElementById("newsExcerpt").value.trim();
      const tags = document.getElementById("newsTags").value.trim();

      if (!title || !content || !category_id) {
        alert("Заполните все обязательные поля");
        return;
      }

      formData.append("title", title);
      formData.append("category_id", category_id);
      formData.append("content", content);
      formData.append("excerpt", excerpt || content.substring(0, 200));
      formData.append("tags", tags || "");
      const isFeatured = document.getElementById("newsFeatured").checked
        ? "1"
        : "0";
      formData.append("is_featured", isFeatured);

      // Добавляем файлы изображений
      const fileInput = document.getElementById("newsImages");
      if (fileInput && fileInput.files.length > 0) {
        console.log("📸 Adding files:", fileInput.files.length);
        for (let i = 0; i < fileInput.files.length; i++) {
          formData.append("images", fileInput.files[i]);
          console.log(`  📸 File ${i + 1}:`, fileInput.files[i].name);
        }
      } else {
        console.log("⚠️ No files selected");
      }

      // Логируем все данные формы
      for (let pair of formData.entries()) {
        console.log("📝 FormData:", pair[0], pair[1]);
      }

      let result;
      if (this.editingId) {
        // Для редактирования добавляем существующие изображения
        const currentNews = await api.getNewsById(this.editingId);
        if (
          currentNews &&
          currentNews.images &&
          currentNews.images.length > 0
        ) {
          formData.append(
            "existing_images",
            JSON.stringify(currentNews.images),
          );
          console.log("📸 Existing images:", currentNews.images);
        }
        result = await api.updateNewsWithImages(this.editingId, formData);
      } else {
        result = await api.createNewsWithImages(formData);
      }

      console.log("✅ News saved:", result);
      this.closeNewsModal();
      this.loadNews();
      this.loadStats();
      alert("Новость успешно сохранена!");
    } catch (error) {
      console.error("❌ Error saving news:", error);
      alert("Ошибка сохранения новости: " + error.message);
    }
  }

  // Категории
  async openCategoryModal() {
    const modal = document.getElementById("categoryModal");
    if (modal) modal.style.display = "flex";
    await this.loadCategoriesList();
  }

  closeCategoryModal() {
    const modal = document.getElementById("categoryModal");
    if (modal) modal.style.display = "none";
    const form = document.getElementById("categoryForm");
    if (form) form.reset();
  }

  async loadCategoriesList() {
    const container = document.getElementById("categoriesList");
    if (!container) return;

    try {
      const categories = await api.getCategories();
      if (categories && categories.length > 0) {
        container.innerHTML = categories
          .map(
            (cat) => `
          <div class="category-item" style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid var(--line);">
            <span>${cat.icon || "📁"} <strong>${cat.name}</strong> <small style="color:var(--muted);">(${cat.slug})</small></span>
            <button class="delete-category-btn secondary-button" data-id="${cat.id}" style="padding:4px 8px;font-size:12px;background:var(--danger);color:white;border:none;border-radius:4px;cursor:pointer;">🗑️</button>
          </div>
        `,
          )
          .join("");
      } else {
        container.innerHTML = '<p class="empty-state">Нет категорий</p>';
      }

      document.querySelectorAll(".delete-category-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = parseInt(btn.dataset.id);
          if (confirm("Удалить категорию? Новости останутся без категории.")) {
            try {
              await api.deleteCategory(id);
              await this.loadCategoriesList();
              this.loadStats();
              this.loadCategories();
            } catch (error) {
              alert("Ошибка: " + error.message);
            }
          }
        });
      });
    } catch (error) {
      console.error("Error loading categories list:", error);
      container.innerHTML =
        '<p class="empty-state">Не удалось загрузить категории</p>';
    }
  }

  async saveCategory() {
    const name = document.getElementById("categoryName").value.trim();
    const slug = document.getElementById("categorySlug").value.trim();
    const description = document
      .getElementById("categoryDescription")
      .value.trim();
    const icon = document.getElementById("categoryIcon").value.trim();

    if (!name || !slug) {
      alert("Название и slug обязательны");
      return;
    }

    try {
      await api.createCategory({ name, slug, description, icon });
      document.getElementById("categoryForm").reset();
      await this.loadCategoriesList();
      this.loadStats();
      this.loadCategories();
      alert("Категория создана!");
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Ошибка: " + error.message);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.adminPage = new AdminPage();
});
