// Shared helpers for the customer pages (index, account, cart, checkout, order-success)
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const userToken = () => localStorage.getItem('userToken');

async function userApi(path, options = {}) {
  options.headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const t = userToken();
  if (t) options.headers.Authorization = 'Bearer ' + t;
  const res = await fetch('/api' + path, options);
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong');
    err.status = res.status;
    throw err;
  }
  return data;
}

function signOut() {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userName');
  location.href = 'index.html';
}

// Updates the "Sign in / Sign out" link and the cart counter in the header
async function refreshHeader() {
  const link = document.getElementById('signin');
  const count = document.getElementById('cart-count');
  if (link) {
    if (userToken()) {
      link.textContent = 'Sign out';
      link.href = '#';
      link.onclick = e => { e.preventDefault(); signOut(); };
    } else {
      link.textContent = 'Sign in';
      link.href = 'account.html';
      link.onclick = null;
    }
  }
  if (count) {
    count.textContent = '0';
    if (userToken()) {
      try {
        const items = await userApi('/cart');
        count.textContent = items.reduce((s, i) => s + i.quantity, 0);
      } catch (e) { if (e.status === 401) localStorage.removeItem('userToken'); }
    }
  }
}

document.addEventListener('DOMContentLoaded', refreshHeader);
