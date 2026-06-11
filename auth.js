const loginForm = document.querySelector('#loginForm');
const registerForm = document.querySelector('#registerForm');
const message = document.querySelector('#authMessage');

function showMessage(text, type = 'error') {
  message.textContent = text;
  message.className = `form-message is-${type}`;
}

function redirectAfterLogin(user) {
  window.location.href = user.role === 'admin' ? 'admin.html' : 'index.html';
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const user = await window.newsApi.login({
        email: document.querySelector('#email').value,
        password: document.querySelector('#password').value
      });
      showMessage('Вход выполнен. Перенаправляем...', 'success');
      redirectAfterLogin(user);
    } catch (error) {
      showMessage(error.message);
    }
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const user = await window.newsApi.register({
        name: document.querySelector('#name').value,
        email: document.querySelector('#email').value,
        password: document.querySelector('#password').value
      });
      showMessage('Аккаунт создан. Перенаправляем...', 'success');
      redirectAfterLogin(user);
    } catch (error) {
      showMessage(error.message);
    }
  });
}
