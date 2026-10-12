/* ===== 1. DATA ===== */
const PRODUCTS = [
  { id: "latte",  name: "Signature Latte", price: 8.5,  type: "hot",  group: "special", desc: "Velvety espresso with house-made caramel and steamed milk." },
  { id: "cap",    name: "Cappuccino",      price: 6.0,  type: "hot",  group: "special",   desc: "Double shot with thick, glossy microfoam." },
  { id: "cold",   name: "Cold Latte",      price: 7.0,  type: "cold", group: "special",  desc: "Slow-chilled espresso over ice and silky milk." },
  { id: "butter", name: "Butter Croissant", price: 4.5, type: "hot",  group: "bake",  desc: "Flaky, laminated, baked each morning." },
  { id: "cinn",   name: "Cinnamon Roll",   price: 5.0,  type: "hot",  group: "bake",  desc: "Warm, gooey and glazed." }
];
const STORIES = [
  { title: "Daily Roast", text: "Small batches roasted every morning.", quote: "“I roast each batch by hand, so every cup tastes like the first.”" },
  { title: "Our Farmers", text: "Direct trade with family farms.",       quote: "“We know every farmer by name, and they know ours.”" },
  { title: "The Community", text: "A neighborhood table since 2018.",    quote: "“Brew Haven is where the neighborhood slows down.”" }
];
const TAX_RATE = 0.08;

/* ===== 2. STATE ===== */
const state = { screen: "home", filter: "all", story: 0, cart: {} };
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => "₱" + n.toFixed(2);

/* ===== 3. NAVIGATION ===== */
function go(screen) {
  state.screen = screen;
  $$(".screen").forEach(s => s.classList.toggle("active", s.id === screen));
  $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.go === screen));
  $("main").scrollTo({ top: 0 });
}

/* ===== 4. MENU ===== */
function itemHTML(p) {
  return `<article class="item" data-type="${p.type}">
    ${$("#img-" + p.id).innerHTML}
    <div class="item-body"><h4>${p.name}<span>${money(p.price)}</span></h4><p>${p.desc}</p>
    <button class="add" data-add="${p.id}">Add to Order</button></div></article>`;
}
function renderMenu() {
  const show = p => state.filter === "all" || p.type === state.filter;
  $("#specialsList").innerHTML = PRODUCTS.filter(p => p.group === "special" && show(p)).map(itemHTML).join("") || "<p class='lead'>Nothing here yet.</p>";
  $("#bakesList").innerHTML = PRODUCTS.filter(p => p.group === "bake").map(itemHTML).join("");
}

/* ===== 5. CART ===== */
function addToCart(id) {
  state.cart[id] = (state.cart[id] || 0) + 1;
  renderCart();
  toast(`${PRODUCTS.find(p => p.id === id).name} added`);
}
function changeQty(id, delta) {
  state.cart[id] = (state.cart[id] || 0) + delta;
  if (state.cart[id] <= 0) delete state.cart[id];
  renderCart();
}
function renderCart() {
  const entries = Object.entries(state.cart);
  const count = entries.reduce((n, [, q]) => n + q, 0);
  const sub = entries.reduce((t, [id, q]) => t + PRODUCTS.find(p => p.id === id).price * q, 0);
  const tax = sub * TAX_RATE;

  $("#cartList").innerHTML = entries.map(([id, q]) => {
    const p = PRODUCTS.find(x => x.id === id);
    return `<li class="cart-item">${$("#img-" + p.id).innerHTML}
      <div class="item-body"><h4>${p.name}</h4><p>${money(p.price)}</p></div>
      <div class="qty"><button data-qty="${id}" data-d="-1" aria-label="Remove one">−</button><b>${q}</b>
      <button data-qty="${id}" data-d="1" aria-label="Add one">+</button></div></li>`;
  }).join("");

  $("#cartEmpty").hidden = count > 0;
  $("#cartBadge").hidden = count === 0;
  $("#cartBadge").textContent = count;
  $("#sumSub").textContent = money(sub);
  $("#sumTax").textContent = money(tax);
  $("#sumShip").textContent = count ? (sub >= 500 ? "Free" : money(50)) : "Calculated at checkout";
  $("#sumTotal").textContent = money(sub + tax + (count && sub < 500 ? 50 : 0));
  $("#checkoutBtn").disabled = count === 0;
}

/* ===== 6. STORY CAROUSEL ===== */
function renderStory() {
  const s = STORIES[state.story];
  $("#storyQuote").textContent = s.quote;
  $("#storyTitle").textContent = s.title;
  $("#storyText").textContent = s.text;
  $("#storyDots").innerHTML = STORIES.map((_, i) => `<i class="${i === state.story ? "on" : ""}"></i>`).join("");
}
const stepStory = d => { state.story = (state.story + d + STORIES.length) % STORIES.length; renderStory(); };

/* ===== 7. TOAST ===== */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

/* ===== 8. EVENTS (delegated) ===== */
document.addEventListener("click", e => {
  const go_ = e.target.closest("[data-go]");   if (go_) { e.preventDefault(); go(go_.dataset.go); return; }
  const add = e.target.closest("[data-add]");  if (add) { addToCart(add.dataset.add); return; }
  const qty = e.target.closest("[data-qty]");  if (qty) { changeQty(qty.dataset.qty, +qty.dataset.d); return; }
  const chip = e.target.closest(".chip");
  if (chip) { state.filter = chip.dataset.filter; $$(".chip").forEach(c => c.classList.toggle("active", c === chip)); renderMenu(); }
});
$("#storyNext").addEventListener("click", () => stepStory(1));
$("#storyBack").addEventListener("click", () => stepStory(-1));
$("#checkoutBtn").addEventListener("click", checkout);

/* ===== 8b. CHECKOUT -> RECEIPT ===== */
function checkout() {
  const items = Object.entries(state.cart).map(([id, qty]) => {
    const p = PRODUCTS.find(x => x.id === id);
    return { name: p.name, price: p.price, qty };
  });
  const subtotal = items.reduce((t, i) => t + i.price * i.qty, 0);
  const shipping = subtotal >= 500 ? 0 : 50;
  const tax = subtotal * TAX_RATE;
  const order = {
    id: "BH-" + Date.now().toString().slice(-6),
    date: new Date().toISOString(),
    items, subtotal, shipping, tax, total: subtotal + shipping + tax
  };
  try { localStorage.setItem("brewHavenOrder", JSON.stringify(order)); } catch (e) { /* storage blocked */ }
  state.cart = {};
  renderCart();
  location.href = "receipt.html";
}

/* ===== 9. INIT ===== */
renderMenu(); renderCart(); renderStory();
if (["home", "story", "menu", "cart"].includes(location.hash.slice(1))) go(location.hash.slice(1));
