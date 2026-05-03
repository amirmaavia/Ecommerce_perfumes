// lib/mysql.js - MySQL Database Connection & Helpers
// import '.env.local'
// import 'dotenv/config';
import mysql from 'mysql2/promise';


const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'luxe_parfums',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

console.log(`🗄️ MySQL Pool created for host: ${process.env.MYSQL_HOST || 'localhost'}`);


export default pool;

// ---- USERS ----
export async function getUsers() {
  const [rows] = await pool.execute('SELECT * FROM users ORDER BY created_at DESC');
  return rows.map(parseUserRow);
}

export async function getUserById(id) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
  return rows.length > 0 ? parseUserRow(rows[0]) : null;
}

export async function getUserByEmail(email) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows.length > 0 ? parseUserRow(rows[0]) : null;
}

export async function createUser(user) {
  await pool.execute(
    `INSERT INTO users (id, name, email, password, role, addresses, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [user.id, user.name, user.email, user.password, user.role || 'user', JSON.stringify(user.addresses || [])]
  );
  return user;
}

export async function updateUser(id, data) {
  const sets = [];
  const values = [];
  if (data.addresses !== undefined) {
    sets.push('addresses = ?');
    values.push(JSON.stringify(data.addresses));
  }
  if (data.name) { sets.push('name = ?'); values.push(data.name); }
  if (data.email) { sets.push('email = ?'); values.push(data.email); }
  if (sets.length === 0) return;
  values.push(id);
  await pool.execute(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
}

function parseUserRow(row) {
  return {
    ...row,
    addresses: typeof row.addresses === 'string' ? JSON.parse(row.addresses) : (row.addresses || []),
    createdAt: row.created_at,
  };
}

// ---- PRODUCTS ----
export async function getProducts(filters = {}) {
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (filters.category && filters.category !== 'all') {
    query += ' AND category_id = ?';
    params.push(filters.category);
  }
  if (filters.gender && filters.gender !== 'all') {
    query += ' AND gender = ?';
    params.push(filters.gender);
  }
  if (filters.search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.featured === 'true' || filters.featured === true) {
    query += ' AND featured = 1';
  }
  if (filters.minPrice) {
    query += ' AND price >= ?';
    params.push(parseFloat(filters.minPrice));
  }
  if (filters.maxPrice) {
    query += ' AND price <= ?';
    params.push(parseFloat(filters.maxPrice));
  }
  if (filters.minRating) {
    query += ' AND rating >= ?';
    params.push(parseFloat(filters.minRating));
  }
  if (filters.size && filters.size !== 'all') {
    query += ' AND size = ?';
    params.push(filters.size);
  }
  if (filters.inStock === 'true') {
    query += ' AND stock > 0';
  }

  query += ' ORDER BY created_at DESC';

  const [rows] = await pool.execute(query, params);
  return rows.map(parseProductRow);
}

export async function getProductById(id) {
  const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
  return rows.length > 0 ? parseProductRow(rows[0]) : null;
}

export async function createProduct(product) {
  await pool.execute(
    `INSERT INTO products (id, name, category_id, price, original_price, stock, image, images, description, notes, size, gender, featured, rating, reviews, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      product.id, product.name, product.category || product.category_id,
      product.price, product.originalPrice || product.price,
      product.stock, product.image || '',
      JSON.stringify(product.images || []),
      product.description || '',
      JSON.stringify(product.notes || {}),
      product.size || '100ml',
      product.gender || 'unisex',
      product.featured ? 1 : 0,
      product.rating || 0, product.reviews || 0,
    ]
  );
  return product;
}

export async function updateProduct(id, data) {
  const existing = await getProductById(id);
  if (!existing) return null;

  const merged = { ...existing, ...data };
  await pool.execute(
    `UPDATE products SET name=?, category_id=?, price=?, original_price=?, stock=?, image=?, images=?, description=?, notes=?, size=?, gender=?, featured=?, rating=?, reviews=?, updated_at=NOW() WHERE id=?`,
    [
      merged.name, merged.category || merged.category_id,
      parseFloat(merged.price), parseFloat(merged.originalPrice || merged.original_price || merged.price),
      parseInt(merged.stock), merged.image || '',
      JSON.stringify(merged.images || []),
      merged.description || '',
      JSON.stringify(merged.notes || {}),
      merged.size || '100ml',
      merged.gender || 'unisex',
      merged.featured ? 1 : 0,
      merged.rating || 0, merged.reviews || 0,
      id,
    ]
  );
  return await getProductById(id);
}

export async function deleteProduct(id) {
  const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export async function reduceStock(productId, quantity) {
  await pool.execute('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?', [quantity, productId, quantity]);
}

function parseProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category_id,
    price: parseFloat(row.price),
    originalPrice: parseFloat(row.original_price),
    stock: parseInt(row.stock),
    image: row.image,
    images: typeof row.images === 'string' ? JSON.parse(row.images || '[]') : (row.images || []),
    description: row.description,
    notes: typeof row.notes === 'string' ? JSON.parse(row.notes || '{}') : (row.notes || {}),
    size: row.size,
    gender: row.gender || 'unisex',
    featured: row.featured === 1 || row.featured === true,
    rating: parseFloat(row.rating || 0),
    reviews: parseInt(row.reviews || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---- CATEGORIES ----
export async function getCategories() {
  const [rows] = await pool.execute('SELECT * FROM categories ORDER BY name ASC');
  return rows;
}

export async function createCategory(cat) {
  await pool.execute(
    'INSERT INTO categories (id, name, description) VALUES (?, ?, ?)',
    [cat.id, cat.name, cat.description || '']
  );
  return cat;
}

export async function deleteCategory(id) {
  await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
}

// ---- DISCOUNTS ----
export async function getDiscounts() {
  const [rows] = await pool.execute('SELECT * FROM discounts ORDER BY created_at DESC');
  return rows.map(parseDiscountRow);
}

export async function getDiscountByCode(code) {
  const [rows] = await pool.execute('SELECT * FROM discounts WHERE code = ? AND active = 1', [code.toUpperCase()]);
  return rows.length > 0 ? parseDiscountRow(rows[0]) : null;
}

export async function createDiscount(discount) {
  await pool.execute(
    `INSERT INTO discounts (id, code, type, value, min_order, max_uses, used_count, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      discount.id, discount.code.toUpperCase(), discount.type,
      discount.value, discount.minOrder || 0,
      discount.maxUses || 0, 0, discount.active !== false ? 1 : 0,
    ]
  );
  return discount;
}

export async function incrementDiscountUsage(code) {
  await pool.execute('UPDATE discounts SET used_count = used_count + 1 WHERE code = ?', [code.toUpperCase()]);
}

function parseDiscountRow(row) {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: parseFloat(row.value),
    minOrder: parseFloat(row.min_order),
    maxUses: parseInt(row.max_uses),
    usedCount: parseInt(row.used_count),
    active: row.active === 1 || row.active === true,
    createdAt: row.created_at,
  };
}

// ---- ORDERS ----
export async function getOrders() {
  const [rows] = await pool.execute('SELECT * FROM orders ORDER BY created_at DESC');
  return rows.map(parseOrderRow);
}

export async function getOrderById(id) {
  const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
  return rows.length > 0 ? parseOrderRow(rows[0]) : null;
}

export async function getOrdersByUser(userId) {
  const [rows] = await pool.execute('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows.map(parseOrderRow);
}

export async function createOrder(order) {
  await pool.execute(
    `INSERT INTO orders (id, user_id, user_name, user_email, items, shipping_address, subtotal, discount_amount, applied_discount, shipping, total, payment_method, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      order.id, order.userId, order.userName, order.userEmail,
      JSON.stringify(order.items), JSON.stringify(order.shippingAddress),
      order.subtotal, order.discountAmount || 0, order.appliedDiscount || null,
      order.shipping, order.total, order.paymentMethod || 'cod', order.status || 'pending',
    ]
  );
  return order;
}

export async function updateOrderStatus(id, status) {
  await pool.execute('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
}

function parseOrderRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
    shippingAddress: typeof row.shipping_address === 'string' ? JSON.parse(row.shipping_address) : (row.shipping_address || {}),
    subtotal: parseFloat(row.subtotal),
    discountAmount: parseFloat(row.discount_amount),
    appliedDiscount: row.applied_discount,
    shipping: parseFloat(row.shipping),
    total: parseFloat(row.total),
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---- ADMIN STATS ----
export async function getAdminStats() {
  const [[{ totalProducts }]] = await pool.execute('SELECT COUNT(*) as totalProducts FROM products');
  const [[{ totalOrders }]] = await pool.execute('SELECT COUNT(*) as totalOrders FROM orders');
  const [[{ totalUsers }]] = await pool.execute('SELECT COUNT(*) as totalUsers FROM users');
  const [[{ totalRevenue }]] = await pool.execute('SELECT COALESCE(SUM(total), 0) as totalRevenue FROM orders WHERE status != "cancelled"');
  return {
    totalProducts: parseInt(totalProducts),
    totalOrders: parseInt(totalOrders),
    totalUsers: parseInt(totalUsers),
    totalRevenue: parseFloat(totalRevenue),
  };
}
