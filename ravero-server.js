const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET','POST','PUT','DELETE'] } });

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'ravero-secret-2026';

// ─── IN-MEMORY DATABASE (يُستبدل بـ Supabase/PostgreSQL في الإنتاج) ───
const DB = {
  users: [
    { id: '1', name: 'مدير النظام', email: 'admin@ravero.com', password: bcrypt.hashSync('admin123', 10), role: 'admin', branch_id: '1', points: 0 },
    { id: '2', name: 'كاشير أحمد', email: 'cashier@ravero.com', password: bcrypt.hashSync('cashier123', 10), role: 'cashier', branch_id: '1', points: 0 },
    { id: '3', name: 'مطبخ محمود', email: 'kitchen@ravero.com', password: bcrypt.hashSync('kitchen123', 10), role: 'kitchen', branch_id: '1', points: 0 },
    { id: '4', name: 'سائق عمر', email: 'driver@ravero.com', password: bcrypt.hashSync('driver123', 10), role: 'driver', branch_id: '1', points: 0 },
  ],
  customers: [
    { id: 'c1', name: 'أحمد السيد', phone: '0101234567', email: 'ahmed@gmail.com', points: 4820, tier: 'gold', total_orders: 48, total_spent: 4656 },
    { id: 'c2', name: 'سارة محمود', phone: '0112345678', email: 'sara@gmail.com', points: 2100, tier: 'gold', total_orders: 32, total_spent: 3104 },
    { id: 'c3', name: 'محمد علي', phone: '0123456789', email: 'moh@gmail.com', points: 8740, tier: 'vip', total_orders: 87, total_spent: 8439 },
    { id: 'c4', name: 'نورا خالد', phone: '0134567890', email: 'noura@gmail.com', points: 950, tier: 'silver', total_orders: 19, total_spent: 1843 },
  ],
  branches: [
    { id: '1', name: 'الفرع الرئيسي', address: '123 شارع النيل، القاهرة', phone: '0200000001', status: 'active' },
    { id: '2', name: 'فرع المستشفى', address: 'مستشفى النيل، شارع الجمهورية', phone: '0200000002', status: 'active' },
    { id: '3', name: 'فرع الجامعة', address: 'جامعة القاهرة، الجيزة', phone: '0200000003', status: 'active' },
    { id: '4', name: 'فرع المطار', address: 'مطار القاهرة الدولي', phone: '0200000004', status: 'setup' },
  ],
  menu: [
    { id: 'm1', name: 'برجر كلاسيك', name_en: 'Classic Burger', description: 'لحم بقري طازج مع الجبن والخضروات', price: 89, cost: 38, category: 'burger', emoji: '🍔', available: true, branch_id: null },
    { id: 'm2', name: 'برجر مزدوج', name_en: 'Double Burger', description: 'قطعتا لحم مع صلصة الشيف الخاصة', price: 129, cost: 55, category: 'burger', emoji: '🍔', available: true, branch_id: null },
    { id: 'm3', name: 'تشيكن برجر', name_en: 'Chicken Burger', description: 'دجاج مقرمش مع صلصة الثوم', price: 79, cost: 32, category: 'burger', emoji: '🐔', available: true, branch_id: null },
    { id: 'm4', name: 'بيتزا مارغريتا', name_en: 'Margherita Pizza', description: 'صلصة طماطم وموتزاريلا طازجة', price: 110, cost: 42, category: 'pizza', emoji: '🍕', available: true, branch_id: null },
    { id: 'm5', name: 'بيتزا بيبروني', name_en: 'Pepperoni Pizza', description: 'بيبروني فاخر مع جبن مذاب', price: 140, cost: 58, category: 'pizza', emoji: '🍕', available: true, branch_id: null },
    { id: 'm6', name: 'باستا بولونيز', name_en: 'Pasta Bolognese', description: 'باستا إيطالية بصلصة اللحم', price: 95, cost: 35, category: 'pasta', emoji: '🍝', available: true, branch_id: null },
    { id: 'm7', name: 'كابتشينو', name_en: 'Cappuccino', description: 'إسبريسو مضاعف مع حليب مبخر', price: 45, cost: 12, category: 'drinks', emoji: '☕', available: true, branch_id: null },
    { id: 'm8', name: 'موهيتو ليمون', name_en: 'Lemon Mojito', description: 'ليمون طازج بالنعناع والسودا', price: 55, cost: 15, category: 'drinks', emoji: '🍹', available: true, branch_id: null },
    { id: 'm9', name: 'كيك الشوكولاتة', name_en: 'Chocolate Cake', description: 'قطعة كيك بالشوكولاتة الداكنة', price: 65, cost: 22, category: 'dessert', emoji: '🎂', available: true, branch_id: null },
    { id: 'm10', name: 'سلطة سيزر', name_en: 'Caesar Salad', description: 'خس رومين بصوص سيزر والقرمشلي', price: 72, cost: 28, category: 'salad', emoji: '🥗', available: true, branch_id: null },
    { id: 'm11', name: 'آيس كريم', name_en: 'Ice Cream', description: 'فانيليا مع صوص الشوكولاتة', price: 48, cost: 18, category: 'dessert', emoji: '🍦', available: true, branch_id: null },
    { id: 'm12', name: 'شاي بالنعناع', name_en: 'Mint Tea', description: 'شاي أحمر طازج بالنعناع', price: 30, cost: 8, category: 'drinks', emoji: '🍵', available: true, branch_id: null },
  ],
  orders: [],
  inventory: [
    { id: 'i1', name: 'لحم بقري مفروم', qty: 8.5, min_qty: 5, unit: 'كجم', supplier: 'مزرعة النيل', branch_id: '1', cost_per_unit: 120 },
    { id: 'i2', name: 'دجاج مقطع', qty: 4.2, min_qty: 4, unit: 'كجم', supplier: 'دواجن الخير', branch_id: '1', cost_per_unit: 85 },
    { id: 'i3', name: 'صلصة طماطم', qty: 1.2, min_qty: 3, unit: 'لتر', supplier: 'مصنع الأصيل', branch_id: '1', cost_per_unit: 25 },
    { id: 'i4', name: 'خبز برجر', qty: 24, min_qty: 30, unit: 'قطعة', supplier: 'مخبز الجودة', branch_id: '1', cost_per_unit: 3 },
    { id: 'i5', name: 'جبن موتزاريلا', qty: 5.8, min_qty: 3, unit: 'كجم', supplier: 'ألبان الذوق', branch_id: '1', cost_per_unit: 95 },
    { id: 'i6', name: 'بن قهوة', qty: 3.4, min_qty: 2, unit: 'كجم', supplier: 'قهوة عربيكا', branch_id: '1', cost_per_unit: 180 },
  ],
  coupons: [
    { id: 'cp1', code: 'RAMADAN50', discount_type: 'percent', discount_value: 50, max_uses: 500, used: 312, expiry: '2026-06-30', active: true },
    { id: 'cp2', code: 'WELCOME20', discount_type: 'percent', discount_value: 20, max_uses: 1000, used: 487, expiry: '2026-12-31', active: true },
    { id: 'cp3', code: 'VIP25', discount_type: 'percent', discount_value: 25, max_uses: 100, used: 67, expiry: '2026-07-31', active: true },
  ],
  transactions: [],
  tables: Array.from({length:12},(_,i)=>({ id:`t${i+1}`, number:`T-${i+1}`, capacity: [4,2,6,4,8,2,4,4,2,6,4,8][i], status:'available', current_order_id: null })),
};

// ─── AUTH MIDDLEWARE ───
function auth(roles = []) {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'No token' });
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      if (roles.length && !roles.includes(decoded.role)) return res.status(403).json({ error: 'Forbidden' });
      next();
    } catch { res.status(401).json({ error: 'Invalid token' }); }
  };
}

// ─── HELPER ───
function emit(event, data, room) {
  if (room) io.to(room).emit(event, data);
  else io.emit(event, data);
}

function calcTier(points) {
  if (points >= 5000) return 'vip';
  if (points >= 2000) return 'gold';
  if (points >= 500)  return 'silver';
  return 'bronze';
}

// ══════════════════════════════════════
//  AUTH ROUTES
// ══════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = DB.users.find(u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  const token = jwt.sign({ id: user.id, name: user.name, role: user.role, branch_id: user.branch_id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, branch_id: user.branch_id } });
});

app.post('/api/auth/register-customer', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (DB.customers.find(c => c.email === email)) return res.status(400).json({ error: 'البريد الإلكتروني مسجل مسبقاً' });
  const customer = { id: uuidv4(), name, email, phone, password: bcrypt.hashSync(password, 10), points: 0, tier: 'bronze', total_orders: 0, total_spent: 0 };
  DB.customers.push(customer);
  const token = jwt.sign({ id: customer.id, name, role: 'customer' }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, customer: { id: customer.id, name, email, phone, points: 0, tier: 'bronze' } });
});

app.get('/api/auth/me', auth(), (req, res) => {
  const user = DB.users.find(u => u.id === req.user.id) || DB.customers.find(c => c.id === req.user.id);
  res.json(user || req.user);
});

// ══════════════════════════════════════
//  MENU ROUTES
// ══════════════════════════════════════
app.get('/api/menu', (req, res) => {
  const { category, branch_id } = req.query;
  let items = DB.menu.filter(m => m.available);
  if (category) items = items.filter(m => m.category === category);
  res.json(items);
});

app.post('/api/menu', auth(['admin','manager']), (req, res) => {
  const item = { id: uuidv4(), ...req.body, available: true };
  DB.menu.push(item);
  emit('menu:updated', item);
  res.status(201).json(item);
});

app.put('/api/menu/:id', auth(['admin','manager']), (req, res) => {
  const idx = DB.menu.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  DB.menu[idx] = { ...DB.menu[idx], ...req.body };
  emit('menu:updated', DB.menu[idx]);
  res.json(DB.menu[idx]);
});

app.delete('/api/menu/:id', auth(['admin']), (req, res) => {
  DB.menu = DB.menu.filter(m => m.id !== req.params.id);
  emit('menu:deleted', req.params.id);
  res.json({ success: true });
});

// ══════════════════════════════════════
//  ORDERS ROUTES
// ══════════════════════════════════════
app.get('/api/orders', auth(), (req, res) => {
  const { status, branch_id, date } = req.query;
  let orders = [...DB.orders];
  if (status) orders = orders.filter(o => o.status === status);
  if (branch_id) orders = orders.filter(o => o.branch_id === branch_id);
  if (date) orders = orders.filter(o => o.created_at.startsWith(date));
  res.json(orders.reverse().slice(0, 100));
});

app.get('/api/orders/:id', auth(), (req, res) => {
  const order = DB.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.post('/api/orders', auth(), (req, res) => {
  const { items, type, table_id, customer_id, address, coupon_code, branch_id, payment_method } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'لا توجد عناصر في الطلب' });

  // حساب الإجمالي
  let subtotal = 0;
  const orderItems = items.map(item => {
    const menuItem = DB.menu.find(m => m.id === item.menu_item_id);
    if (!menuItem) throw new Error(`Item ${item.menu_item_id} not found`);
    const lineTotal = menuItem.price * item.qty;
    subtotal += lineTotal;
    return { ...item, name: menuItem.name, price: menuItem.price, line_total: lineTotal, emoji: menuItem.emoji };
  });

  // تطبيق الكوبون
  let discount = 0;
  if (coupon_code) {
    const coupon = DB.coupons.find(c => c.code === coupon_code && c.active && c.used < c.max_uses);
    if (coupon) {
      discount = coupon.discount_type === 'percent' ? subtotal * coupon.discount_value / 100 : coupon.discount_value;
      coupon.used++;
    }
  }

  const vat = Math.round((subtotal - discount) * 0.14);
  const total = subtotal - discount + vat;

  const order = {
    id: uuidv4(),
    order_number: '#' + String(DB.orders.length + 1848).padStart(4,'0'),
    type: type || 'dine',
    status: 'new',
    items: orderItems,
    subtotal, discount, vat, total,
    table_id, customer_id, address,
    branch_id: branch_id || '1',
    payment_method: payment_method || 'cash',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notes: req.body.notes || '',
  };

  DB.orders.push(order);

  // نقاط الولاء
  if (customer_id) {
    const cust = DB.customers.find(c => c.id === customer_id);
    if (cust) {
      cust.points += Math.floor(total / 10);
      cust.total_orders++;
      cust.total_spent += total;
      cust.tier = calcTier(cust.points);
      emit('customer:points_updated', { customer_id, points: cust.points, tier: cust.tier });
    }
  }

  // تحديث الطاولة
  if (table_id) {
    const table = DB.tables.find(t => t.id === table_id);
    if (table) { table.status = 'occupied'; table.current_order_id = order.id; }
  }

  // إشعار Socket.io
  emit('order:new', order);
  emit('order:new', order, `branch:${order.branch_id}`);
  emit('order:new', order, 'kitchen');

  // تسجيل المعاملة المالية
  DB.transactions.push({ id: uuidv4(), order_id: order.id, amount: total, type: 'revenue', method: payment_method, created_at: new Date().toISOString() });

  res.status(201).json(order);
});

app.put('/api/orders/:id/status', auth(['admin','cashier','kitchen','driver','manager']), (req, res) => {
  const order = DB.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const { status } = req.body;
  const validTransitions = { new:['preparing'], preparing:['ready'], ready:['out_for_delivery','delivered','completed'], out_for_delivery:['delivered'], delivered:['completed'], completed:[] };
  if (!validTransitions[order.status]?.includes(status)) return res.status(400).json({ error: 'Invalid status transition' });
  order.status = status;
  order.updated_at = new Date().toISOString();
  if (status === 'completed' || status === 'delivered') {
    const table = DB.tables.find(t => t.id === order.table_id);
    if (table) { table.status = 'available'; table.current_order_id = null; }
    order.payment_status = 'paid';
  }
  emit('order:status_updated', { id: order.id, status, order });
  emit('order:status_updated', { id: order.id, status, order }, `branch:${order.branch_id}`);
  if (order.customer_id) emit('order:status_updated', { id: order.id, status, order }, `customer:${order.customer_id}`);
  res.json(order);
});

// ══════════════════════════════════════
//  INVENTORY ROUTES
// ══════════════════════════════════════
app.get('/api/inventory', auth(), (req, res) => {
  const items = DB.inventory.map(i => ({
    ...i, status: i.qty <= 0 ? 'out' : i.qty < i.min_qty ? 'low' : 'ok'
  }));
  res.json(items);
});

app.put('/api/inventory/:id', auth(['admin','manager']), (req, res) => {
  const idx = DB.inventory.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  DB.inventory[idx] = { ...DB.inventory[idx], ...req.body };
  const item = DB.inventory[idx];
  if (item.qty < item.min_qty) emit('inventory:low', item);
  res.json(item);
});

app.post('/api/inventory', auth(['admin','manager']), (req, res) => {
  const item = { id: uuidv4(), ...req.body };
  DB.inventory.push(item);
  res.status(201).json(item);
});

// ══════════════════════════════════════
//  CUSTOMERS ROUTES
// ══════════════════════════════════════
app.get('/api/customers', auth(['admin','manager','cashier']), (req, res) => {
  const customers = DB.customers.map(c => ({ ...c, password: undefined }));
  res.json(customers);
});

app.get('/api/customers/:id', auth(), (req, res) => {
  const c = DB.customers.find(c => c.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  const orders = DB.orders.filter(o => o.customer_id === c.id).slice(0,10);
  res.json({ ...c, password: undefined, recent_orders: orders });
});

app.post('/api/customers', auth(['admin','cashier']), (req, res) => {
  const c = { id: uuidv4(), ...req.body, points: 0, tier: 'bronze', total_orders: 0, total_spent: 0 };
  DB.customers.push(c);
  res.status(201).json({ ...c, password: undefined });
});

// ══════════════════════════════════════
//  BRANCHES ROUTES
// ══════════════════════════════════════
app.get('/api/branches', auth(), (req, res) => res.json(DB.branches));

app.post('/api/branches', auth(['admin']), (req, res) => {
  const branch = { id: uuidv4(), ...req.body, status: 'active' };
  DB.branches.push(branch);
  res.status(201).json(branch);
});

// ══════════════════════════════════════
//  TABLES ROUTES
// ══════════════════════════════════════
app.get('/api/tables', auth(), (req, res) => res.json(DB.tables));

app.put('/api/tables/:id', auth(['admin','cashier']), (req, res) => {
  const idx = DB.tables.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  DB.tables[idx] = { ...DB.tables[idx], ...req.body };
  emit('table:updated', DB.tables[idx]);
  res.json(DB.tables[idx]);
});

// ══════════════════════════════════════
//  COUPONS ROUTES
// ══════════════════════════════════════
app.get('/api/coupons', auth(), (req, res) => res.json(DB.coupons));

app.post('/api/coupons/validate', auth(), (req, res) => {
  const { code, amount } = req.body;
  const coupon = DB.coupons.find(c => c.code === code && c.active && c.used < c.max_uses && new Date(c.expiry) > new Date());
  if (!coupon) return res.status(400).json({ error: 'كوبون غير صالح أو منتهي الصلاحية' });
  const discount = coupon.discount_type === 'percent' ? amount * coupon.discount_value / 100 : coupon.discount_value;
  res.json({ valid: true, coupon, discount: Math.round(discount) });
});

app.post('/api/coupons', auth(['admin','manager']), (req, res) => {
  const c = { id: uuidv4(), ...req.body, used: 0, active: true };
  DB.coupons.push(c);
  res.status(201).json(c);
});

// ══════════════════════════════════════
//  ANALYTICS ROUTES
// ══════════════════════════════════════
app.get('/api/analytics/dashboard', auth(['admin','manager']), (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = DB.orders.filter(o => o.created_at.startsWith(today));
  const revenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const byType = { dine: 0, delivery: 0, pickup: 0 };
  todayOrders.forEach(o => { if (byType[o.type] !== undefined) byType[o.type]++; });
  const topProducts = {};
  DB.orders.forEach(o => o.items.forEach(i => {
    topProducts[i.name] = (topProducts[i.name] || 0) + i.qty;
  }));
  const topProductsList = Object.entries(topProducts).sort((a,b) => b[1]-a[1]).slice(0,5).map(([name,qty]) => ({ name, qty }));
  const lowInventory = DB.inventory.filter(i => i.qty < i.min_qty);

  res.json({
    today: { orders: todayOrders.length, revenue, avg_order: todayOrders.length ? Math.round(revenue / todayOrders.length) : 0, by_type: byType },
    total: { customers: DB.customers.length, menu_items: DB.menu.length, branches: DB.branches.length },
    top_products: topProductsList,
    low_inventory: lowInventory,
    pending_orders: DB.orders.filter(o => ['new','preparing'].includes(o.status)).length,
  });
});

app.get('/api/analytics/revenue', auth(['admin','manager']), (req, res) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOrders = DB.orders.filter(o => o.created_at.startsWith(dateStr));
    days.push({ date: dateStr, revenue: dayOrders.reduce((s,o) => s+o.total, 0), orders: dayOrders.length });
  }
  res.json(days);
});

// ══════════════════════════════════════
//  SOCKET.IO
// ══════════════════════════════════════
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join:branch', (branch_id) => socket.join(`branch:${branch_id}`));
  socket.on('join:kitchen', () => socket.join('kitchen'));
  socket.on('join:customer', (customer_id) => socket.join(`customer:${customer_id}`));
  socket.on('join:driver', (driver_id) => socket.join(`driver:${driver_id}`));

  socket.on('driver:location', ({ order_id, lat, lng }) => {
    io.emit('driver:location_update', { order_id, lat, lng, timestamp: new Date().toISOString() });
  });

  socket.on('order:update_status', ({ order_id, status, user_id }) => {
    const order = DB.orders.find(o => o.id === order_id);
    if (order) {
      order.status = status;
      order.updated_at = new Date().toISOString();
      io.emit('order:status_updated', { id: order_id, status, order });
    }
  });

  socket.on('kitchen:item_done', ({ order_id, item_index }) => {
    io.to('kitchen').emit('kitchen:item_confirmed', { order_id, item_index });
  });

  socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));
});

// ─── SERVER START ───
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Ravero Server running on port ${PORT}`));
module.exports = { app, io };
