// API Client
const API_BASE_URL = "/api"; // Используем относительный путь

class ApiClient {
  constructor() {
    this.token = localStorage.getItem("token");
    console.log("API Client initialized");
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log("Making request to:", url, options);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      // Проверяем, что ответ JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Сервер вернул не JSON ответ");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Произошла ошибка");
      }

      return data;
    } catch (error) {
      console.error("Request error:", error);
      throw error;
    }
  }

  // Auth endpoints
  async register(username, email, password) {
    console.log("Registering user:", username);
    const data = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });

    if (data.token) {
      console.log("✅ Token received, saving...");
      this.setToken(data.token);
    }

    return data;
  }

  async login(username, password) {
    console.log("Logging in user:", username);
    const data = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } catch (e) {
      // Игнорируем ошибки при выходе
    }
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request("/auth/me");
  }

  // News endpoints
  async getNews({
    limit = 20,
    offset = 0,
    category = null,
    search = null,
  } = {}) {
    const params = new URLSearchParams();
    params.append("limit", limit);
    params.append("offset", offset);
    if (category) params.append("category", category);
    if (search) params.append("search", search);
    return this.request(`/news?${params.toString()}`);
  }

  async getFeaturedNews() {
    return this.request("/news/featured");
  }

  async getLatestNews(limit = 5) {
    return this.request(`/news/latest?limit=${limit}`);
  }

  async getNewsById(id) {
    return this.request(`/news/${id}`);
  }

  async getCategories() {
    return this.request("/categories");
  }

  async createNews(data) {
    return this.request("/news", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createNewsWithImages(formData) {
    const url = `${API_BASE_URL}/news`;
    console.log("📤 Sending create request with formData");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Произошла ошибка");
      }

      console.log("✅ Create response:", data);
      return data;
    } catch (error) {
      console.error("❌ Create error:", error);
      throw error;
    }
  }

  async updateNewsWithImages(id, formData) {
    const url = `${API_BASE_URL}/news/${id}`;
    console.log("📤 Sending update request with formData");

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Произошла ошибка");
      }

      console.log("✅ Update response:", data);
      return data;
    } catch (error) {
      console.error("❌ Update error:", error);
      throw error;
    }
  }

  async updateNews(id, data) {
    return this.request(`/news/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteNews(id) {
    return this.request(`/news/${id}`, {
      method: "DELETE",
    });
  }

  // Category endpoints
  async createCategory(data) {
    return this.request("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id, data) {
    return this.request(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id) {
    return this.request(`/categories/${id}`, {
      method: "DELETE",
    });
  }

  // Admin endpoints
  async getStats() {
    return this.request("/admin/stats");
  }

  async getUsers() {
    return this.request("/admin/users");
  }
}

const api = new ApiClient();
console.log("API Client created:", api);
