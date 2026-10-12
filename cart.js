const naira = n => '₦' + Number(n).toLocaleString('en-NG');
const box = document.getElementById('cart');

async function loadCart() {
  if (!userToken()) { location.href = 'account.html?next=cart.html'; return; }
  let items;
  try { items = await userApi('/cart'); }
  catch (e) { if (e.status === 401) { localStorage.removeItem('userToken'); location.href = 'account.html?next=cart.html'; return; } box.textContent = e.message; return; }

  if (!items.length) { box.innerHTML = '<p class="muted">Your cart is empty.</p><a class="btn" href="index.html">Browse cars</a>'; refreshHeader(); return; }

  const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  box.innerHTML = `
    <table class="cart-table">
      ${items.map(i => `
        <tr>
          <td>${i.image_url ? `<img class="thumb" src="${esc(i.image_url)}" alt="">` : ''}</td>
          <td><strong>${esc(i.name)}</strong><br><span class="muted">${naira(i.price)} each</span></td>
          <td class="qty">
            <button data-minus="${i.product_id}" data-q="${i.quantity}" aria-label="Decrease">−</button>
            <span>${i.quantity}</span>
            <button data-plus="${i.product_id}" data-q="${i.quantity}" aria-label="Increase">+</button>
          </td>
          <td>${naira(Number(i.price) * i.quantity)}</td>
          <td><button class="link" data-remove="${i.product_id}">Remove</button></td>
        </tr>`).join('')}
    </table>
    <div class="total"><span>Total: ${naira(total)}</span>
      <a class="btn" href="checkout.html">Checkout</a></div>`;
  refreshHeader();
}

box.addEventListener('click', async e => {
  const d = e.target.dataset;
  try {
    if (d.plus) await userApi('/cart/' + d.plus, { method: 'PUT', body: JSON.stringify({ quantity: +d.q + 1 }) });
    else if (d.minus) await userApi('/cart/' + d.minus, { method: 'PUT', body: JSON.stringify({ quantity: +d.q - 1 }) });
    else if (d.remove) await userApi('/cart/' + d.remove, { method: 'DELETE' });
    else return;
    loadCart();
  } catch (err) { alert(err.message); }
});

loadCart();
