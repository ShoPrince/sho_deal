const $ = id => document.getElementById(id);
let token = sessionStorage.getItem('adminToken');
let products = [];
const fields = ['category','name','year','price','description'];
const specKeys = {engine:'Engine',mileage:'Mileage',transmission:'Transmission',fuel:'Fuel',color:'Color',condition:'Condition'};

async function api(path, options = {}) {
  options.headers = { ...(options.headers || {}), 'x-admin-token': token || '' };
  const res = await fetch('/api/admin' + path, options);
  const data = await res.json();
  if (res.status === 401) { logout(); throw new Error(data.error); }
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

function showDashboard(on) {
  $('login').classList.toggle('hidden', on);
  $('dashboard').classList.toggle('hidden', !on);
  $('logout').classList.toggle('hidden', !on);
  if (on) { loadProducts(); loadOrders(); }
}
function logout() { token = null; sessionStorage.removeItem('adminToken'); showDashboard(false); }

$('login-btn').onclick = async () => {
  const loginMsg = $('login-msg');
  loginMsg.textContent = 'Signing in...';
  loginMsg.className = 'muted';
  try {
    const r = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password: $('password').value }) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    token = data.token; sessionStorage.setItem('adminToken', token); $('password').value = ''; showDashboard(true);
    loginMsg.textContent = 'Welcome back!'; loginMsg.className = 'success';
  } catch (e) {
    loginMsg.textContent = e.message;
    loginMsg.className = 'error';
  }
};
$('logout').onclick = e => { e.preventDefault(); logout(); };

$('password').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('login-btn').click();
});

async function loadProducts() {
  products = await api('/products');
  $('list').innerHTML = '<tr><th>Name</th><th>Type</th><th>Price</th><th></th></tr>' + products.map(p => `
    <tr><td>${esc(p.name)}</td><td>${esc(p.category)}</td><td>₦${Number(p.price).toLocaleString('en-NG')}</td>
    <td><button data-edit="${p.id}">Edit</button><button data-del="${p.id}">Delete</button></td></tr>`).join('');
}

function resetForm() {
  $('product-form').reset(); $('id').value = '';
  $('form-title').textContent = 'Add a new product';
  $('cancel-btn').classList.add('hidden');
}
$('cancel-btn').onclick = resetForm;

$('list').onclick = async e => {
  const edit = e.target.dataset.edit, del = e.target.dataset.del;
  if (edit) {
    const p = products.find(x => x.id == edit);
    fields.forEach(f => $(f).value = p[f] ?? '');
    Object.entries(specKeys).forEach(([id, key]) => $(id).value = (p.details || {})[key] || '');
    $('id').value = p.id; $('form-title').textContent = 'Edit: ' + p.name;
    $('cancel-btn').classList.remove('hidden'); scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (del && confirm('Delete this product? This cannot be undone.')) {
    await api('/products/' + del, { method: 'DELETE' }); loadProducts();
  }
};

$('product-form').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData();
  [...fields, ...Object.keys(specKeys)].forEach(f => fd.append(f, $(f).value));
  if ($('image').files[0]) fd.append('image', $('image').files[0]);
  const id = $('id').value;
  try {
    await api(id ? '/products/' + id : '/products', { method: id ? 'PUT' : 'POST', body: fd });
    $('msg').textContent = id ? 'Product updated.' : 'Product added. It is now on the website.';
    resetForm(); loadProducts();
  } catch (err) { $('msg').textContent = err.message; }
};

showDashboard(!!token);

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function loadOrders() {
  const orders = await api('/orders');
  $('orders').innerHTML = '<tr><th>#</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Deliver to</th><th>Date</th></tr>' +
    (orders.length ? orders.map(o => `<tr>
      <td>${o.id}</td><td>${esc(o.full_name)}<br><span class="muted">${esc(o.email)}<br>${esc(o.phone)}</span></td>
      <td>${esc(o.items)}</td><td>₦${Number(o.total).toLocaleString('en-NG')}</td>
      <td>${o.payment_method === 'card' ? 'Card' : 'Pay on delivery'}<br><span class="muted">${esc(o.payment_status)} / ${esc(o.status)}</span></td>
      <td>${esc(o.delivery_address)}</td><td>${new Date(o.created_at).toLocaleDateString('en-NG')}</td></tr>`).join('')
      : '<tr><td colspan="7" class="muted">No orders yet.</td></tr>');
}
