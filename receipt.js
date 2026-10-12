/* ===== 1. HELPERS ===== */
const $ = id => document.getElementById(id);
const money = n => "₱" + Number(n).toFixed(2);

function loadOrder() {
  try { return JSON.parse(localStorage.getItem("brewHavenOrder")); }
  catch (e) { return null; }
}

/* ===== 2. RENDER ===== */
function row(...cells) {
  const tr = document.createElement("tr");
  cells.forEach(text => { const td = document.createElement("td"); td.textContent = text; tr.appendChild(td); });
  return tr;
}

function render(order) {
  const when = new Date(order.date);
  $("rId").textContent = order.id;
  $("rDate").textContent = when.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  $("rTime").textContent = when.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

  order.items.forEach(i => $("rItems").appendChild(row(i.name, i.qty, money(i.price), money(i.price * i.qty))));

  $("rSub").textContent = money(order.subtotal);
  $("rShip").textContent = order.shipping ? money(order.shipping) : "Free";
  $("rTax").textContent = money(order.tax);
  $("rTotal").textContent = money(order.total);
}

/* ===== 3. INIT ===== */
const order = loadOrder();
if (order && order.items && order.items.length) {
  render(order);
  $("receipt").hidden = false;
  $("actions").hidden = false;
} else {
  $("noOrder").hidden = false;
}
$("printBtn").addEventListener("click", () => window.print());
