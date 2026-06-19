// Auth Page
class AuthPage {
  constructor() {
    this.isLogin = true;
    this.init();
  }

  init() {
    console.log('Auth page initialized');
    this.setupForm();
    this.setupToggle();
    
    // Если уже авторизован, редирект на главную
    if (localStorage.getItem('token')) {
      window.location.href = 'index.html';
    }
  }

  setupForm() {
    const form = document.getElementById('authForm');
    const submitBtn = document.getElementById('submitBtn');
    const message = document.getElementById('formMessage');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const emailInput = document.getElementById('email');
    
    if (!form) {
      console.error('Form not found!');
      return;
    }

    console.log('Form found, setting up submit handler');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Form submitted');
      
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();
      const email = emailInput ? emailInput.value.trim() : '';
      
      message.textContent = '';
      message.className = 'form-message';
      
      // Валидация
      if (!username || !password) {
        message.textContent = 'Заполните все обязательные поля';
        return;
      }
      
      if (!this.isLogin && !email) {
        message.textContent = 'Введите email';
        return;
      }
      
      if (!this.isLogin && password.length < 6) {
        message.textContent = 'Пароль должен быть не менее 6 символов';
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Загрузка...';
      
      try {
        let result;
        if (this.isLogin) {
          console.log('Attempting login with:', username);
          result = await api.login(username, password);
        } else {
          console.log('Attempting register with:', username, email);
          result = await api.register(username, email, password);
          
          // ✅ ПОСЛЕ РЕГИСТРАЦИИ - АВТОМАТИЧЕСКИ ВХОДИМ
          if (result.token) {
            console.log('✅ Registration successful, auto-login...');
            // Токен уже сохранен в api.setToken()
            // Просто показываем сообщение и редиректим
            message.textContent = '✅ Регистрация успешна! Выполняется вход...';
            message.className = 'form-message is-success';
            
            setTimeout(() => {
              window.location.href = 'index.html';
            }, 1500);
            return;
          }
        }
        
        console.log('Result:', result);
        
        if (result.token) {
          message.textContent = this.isLogin ? '✅ Вход выполнен успешно!' : '✅ Регистрация успешна!';
          message.className = 'form-message is-success';
          
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        }
      } catch (error) {
        console.error('Auth error:', error);
        message.textContent = error.message || 'Произошла ошибка';
        message.className = 'form-message';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = this.isLogin ? 'Войти' : 'Зарегистрироваться';
      }
    });
  }

  setupToggle() {
    const toggleLink = document.getElementById('toggleAuth');
    const title = document.getElementById('authTitle');
    const emailLabel = document.getElementById('emailLabel');
    const hint = document.getElementById('authHint');
    const submitBtn = document.getElementById('submitBtn');
    const emailInput = document.getElementById('email');
    
    if (!toggleLink) {
      console.error('Toggle link not found!');
      return;
    }

    console.log('Toggle link found');

    toggleLink.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Toggle clicked');
      this.isLogin = !this.isLogin;
      
      title.textContent = this.isLogin ? 'Вход' : 'Регистрация';
      submitBtn.textContent = this.isLogin ? 'Войти' : 'Зарегистрироваться';
      hint.innerHTML = this.isLogin 
        ? 'Нет аккаунта? <a href="#" id="toggleAuth">Зарегистрироваться</a>'
        : 'Уже есть аккаунт? <a href="#" id="toggleAuth">Войти</a>';
      
      if (emailLabel) {
        emailLabel.style.display = this.isLogin ? 'none' : 'block';
      }
      
      if (emailInput) {
        emailInput.required = !this.isLogin;
      }
      
      // Очищаем сообщение
      const message = document.getElementById('formMessage');
      if (message) {
        message.textContent = '';
        message.className = 'form-message';
      }
    });
  }
}

// Запускаем после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing AuthPage');
  window.authPage = new AuthPage();
});