const state = {
  articles: [],
  editingId: null
};

const elements = {
  listView: document.querySelector('#listView'),
  formView: document.querySelector('#formView'),
  formTitle: document.querySelector('#formTitle'),
  table: document.querySelector('#newsTable'),
  count: document.querySelector('#adminCount'),
  form: document.querySelector('#newsForm'),
  createButton: document.querySelector('#createButton'),
  cancelButton: document.querySelector('#cancelButton'),
  navLinks: document.querySelectorAll('.admin-nav-link'),
  adminUser: document.querySelector('#adminUser')
};

const formatDate = (date) => new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
}).format(new Date(date));

function setView(view) {
  const isForm = view === 'form';
  elements.listView.classList.toggle('is-hidden', isForm);
  elements.formView.classList.toggle('is-hidden', !isForm);
  elements.navLinks.forEach((link) => link.classList.toggle('is-active', link.dataset.view === view));
}

function resetForm() {
  state.editingId = null;
  elements.form.reset();
  document.querySelector('#newsId').value = '';
  document.querySelector('#status').value = 'Опубликовано';
  elements.formTitle.textContent = 'Создать новость';
}

function fillForm(article) {
  state.editingId = article.id;
  document.querySelector('#newsId').value = article.id;
  document.querySelector('#title').value = article.title;
  document.querySelector('#imageUrl').value = article.imageUrl;
  document.querySelector('#category').value = article.category;
  document.querySelector('#status').value = article.status;
  document.querySelector('#excerpt').value = article.excerpt;
  document.querySelector('#content').value = article.content;
  document.querySelector('#tags').value = article.tags.join(', ');
  elements.formTitle.textContent = 'Редактировать новость';
  setView('form');
}

function getFormPayload() {
  return {
    title: document.querySelector('#title').value,
    imageUrl: document.querySelector('#imageUrl').value,
    category: document.querySelector('#category').value,
    status: document.querySelector('#status').value,
    excerpt: document.querySelector('#excerpt').value,
    content: document.querySelector('#content').value,
    tags: document.querySelector('#tags').value
  };
}

function renderTable() {
  elements.count.textContent = `${state.articles.length} записей`;
  elements.table.innerHTML = state.articles.map((article) => `
    <tr>
      <td>${article.id}</td>
      <td>
        <strong>${article.title}</strong>
        <span>${article.category}</span>
      </td>
      <td>${formatDate(article.date)}</td>
      <td><span class="status-badge ${article.status === 'Опубликовано' ? 'is-published' : 'is-draft'}">${article.status}</span></td>
      <td>
        <div class="table-actions">
          <button type="button" data-action="edit" data-id="${article.id}">Редактировать</button>
          <button type="button" data-action="delete" data-id="${article.id}">Удалить</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function loadArticles() {
  state.articles = await window.newsApi.getArticles();
  renderTable();
}

async function protectAdminPage() {
  const user = await window.newsApi.getCurrentUser();

  if (!user) {
    window.location.href = 'login.html';
    return false;
  }

  if (user.role !== 'admin') {
    document.body.innerHTML = `
      <main class="access-denied">
        <section>
          <p class="section-kicker">Доступ ограничен</p>
          <h1>Нужна роль администратора</h1>
          <p>Ваш аккаунт может читать новости, но не может создавать, редактировать или удалять материалы.</p>
          <a class="primary-button" href="index.html">Вернуться на сайт</a>
        </section>
      </main>
    `;
    return false;
  }

  elements.adminUser.innerHTML = `
    <strong>${user.name}</strong>
    <span>${user.email}</span>
    <button id="adminLogout" type="button">Выйти</button>
  `;

  document.querySelector('#adminLogout').addEventListener('click', async () => {
    await window.newsApi.logout();
    window.location.href = 'login.html';
  });

  return true;
}

elements.createButton.addEventListener('click', () => {
  resetForm();
  setView('form');
});

elements.cancelButton.addEventListener('click', () => {
  resetForm();
  setView('list');
});

elements.navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    if (link.dataset.view === 'form') resetForm();
    setView(link.dataset.view);
  });
});

elements.table.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const id = Number(button.dataset.id);
  if (button.dataset.action === 'edit') {
    const article = state.articles.find((item) => Number(item.id) === id);
    if (article) fillForm(article);
  }

  if (button.dataset.action === 'delete') {
    const confirmed = window.confirm('Удалить эту новость?');
    if (!confirmed) return;
    await window.newsApi.deleteArticle(id);
    await loadArticles();
  }
});

elements.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = getFormPayload();

  if (state.editingId) {
    await window.newsApi.updateArticle(state.editingId, payload);
  } else {
    await window.newsApi.createArticle(payload);
  }

  resetForm();
  await loadArticles();
  setView('list');
});

protectAdminPage().then((allowed) => {
  if (allowed) loadArticles();
});
