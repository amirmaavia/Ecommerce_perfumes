// setup-db.js - Run this to create MySQL tables and seed data
// Usage: node setup-db.js
import 'dotenv/config';
import mysql from 'mysql2/promise';

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const DB_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
};

const DB_NAME = process.env.MYSQL_DATABASE || 'luxe_parfums';

async function setup() {
  console.log('🔧 Setting up LUXE Parfums MySQL Database...\n');

  // Connect without database first
  const conn = await mysql.createConnection(DB_CONFIG);

  // Create database
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`✅ Database "${DB_NAME}" created/verified`);

  await conn.query(`USE \`${DB_NAME}\``);

  // Create tables
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('user', 'admin') DEFAULT 'user',
      addresses JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email)
    )
  `);
  console.log('✅ Table "users" created');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT
    )
  `);
  console.log('✅ Table "categories" created');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category_id VARCHAR(36),
      price DECIMAL(10,2) NOT NULL,
      original_price DECIMAL(10,2),
      stock INT DEFAULT 0,
      image VARCHAR(500),
      images JSON,
      description TEXT,
      notes JSON,
      size VARCHAR(50) DEFAULT '100ml',
      gender ENUM('male', 'female', 'unisex') DEFAULT 'unisex',
      featured TINYINT(1) DEFAULT 0,
      rating DECIMAL(2,1) DEFAULT 0,
      reviews INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      INDEX idx_category (category_id),
      INDEX idx_gender (gender),
      INDEX idx_featured (featured),
      INDEX idx_price (price)
    )
  `);
  console.log('✅ Table "products" created');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS discounts (
      id VARCHAR(36) PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      type ENUM('percentage', 'fixed') NOT NULL,
      value DECIMAL(10,2) NOT NULL,
      min_order DECIMAL(10,2) DEFAULT 0,
      max_uses INT DEFAULT 0,
      used_count INT DEFAULT 0,
      active TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_code (code)
    )
  `);
  console.log('✅ Table "discounts" created');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      user_name VARCHAR(255),
      user_email VARCHAR(255),
      items JSON,
      shipping_address JSON,
      subtotal DECIMAL(10,2),
      discount_amount DECIMAL(10,2) DEFAULT 0,
      applied_discount VARCHAR(50),
      shipping DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2),
      payment_method VARCHAR(50) DEFAULT 'cod',
      status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_user (user_id),
      INDEX idx_status (status)
    )
  `);
  console.log('✅ Table "orders" created');

  // Seed data
  console.log('\n🌱 Seeding data...\n');

  // Check if data already exists
  const [[{ catCount }]] = await conn.query('SELECT COUNT(*) as catCount FROM categories');
  if (catCount > 0) {
    console.log('⚠️  Data already exists, skipping seed. Drop tables first to re-seed.');
    await conn.end();
    return;
  }

  // Seed categories
  const categories = [
    { id: 'cat1', name: 'Oud', description: 'Rich, woody oriental fragrances' },
    { id: 'cat2', name: 'Floral', description: 'Light, fresh floral perfumes' },
    { id: 'cat3', name: 'Citrus', description: 'Fresh citrus-based scents' },
    { id: 'cat4', name: 'Luxury', description: 'Premium luxury collection' },
  ];
  for (const cat of categories) {
    await conn.query('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)', [cat.id, cat.name, cat.description]);
  }
  console.log('✅ Categories seeded (4)');

  // Seed products with gender field
  const products = [
    {
      id: 'prod1', name: 'Oud Royal Noir', category_id: 'cat1',
      price: 4999, original_price: 6499, stock: 50,
      image: '/images/perfume1.jpg',
      images: ['/images/perfume1.jpg', '/images/perfume2.jpg', '/images/perfume3.jpg'],
      description: 'A majestic blend of deep Oud, saffron, and musk. The king of oriental fragrances, crafted for those who command attention.',
      notes: { top: 'Saffron, Cardamom', heart: 'Oud, Rose', base: 'Musk, Amber' },
      size: '100ml', gender: 'male', featured: true, rating: 4.8, reviews: 124,
    },
    {
      id: 'prod2', name: 'Rose Élégance', category_id: 'cat2',
      price: 3299, original_price: 3299, stock: 75,
      image: '/images/perfume2.jpg',
      images: ['/images/perfume2.jpg', '/images/perfume4.jpg', '/images/perfume5.jpg'],
      description: 'An exquisite bouquet of Bulgarian roses with hints of peony and white musk. Timeless feminine elegance.',
      notes: { top: 'Bergamot, Peach', heart: 'Bulgarian Rose, Peony', base: 'White Musk, Sandalwood' },
      size: '75ml', gender: 'female', featured: true, rating: 4.6, reviews: 89,
    },
    {
      id: 'prod3', name: 'Citrus Soleil', category_id: 'cat3',
      price: 2499, original_price: 2999, stock: 100,
      image: '/images/perfume3.jpg',
      images: ['/images/perfume3.jpg', '/images/perfume1.jpg', '/images/perfume6.jpg'],
      description: 'A vibrant explosion of Mediterranean citrus fruits. Fresh, energetic, and perfect for every day.',
      notes: { top: 'Lemon, Bergamot, Grapefruit', heart: 'Neroli, Jasmine', base: 'Cedar, Vetiver' },
      size: '100ml', gender: 'unisex', featured: false, rating: 4.4, reviews: 67,
    },
    {
      id: 'prod4', name: 'Midnight Amber', category_id: 'cat4',
      price: 7999, original_price: 7999, stock: 25,
      image: '/images/perfume4.jpg',
      images: ['/images/perfume4.jpg', '/images/perfume6.jpg', '/images/perfume1.jpg'],
      description: 'The ultimate luxury experience. Warm amber, precious woods, and a whisper of vanilla create an unforgettable signature.',
      notes: { top: 'Aldehydes, Bergamot', heart: 'Amber, Patchouli, Rose', base: 'Vanilla, Benzoin, Musk' },
      size: '50ml', gender: 'unisex', featured: true, rating: 4.9, reviews: 45,
    },
    {
      id: 'prod5', name: 'Aqua Marine', category_id: 'cat3',
      price: 1999, original_price: 2499, stock: 80,
      image: '/images/perfume5.jpg',
      images: ['/images/perfume5.jpg', '/images/perfume3.jpg', '/images/perfume2.jpg'],
      description: 'Ocean-inspired freshness with aquatic notes and a clean, crisp finish. Pure freedom in a bottle.',
      notes: { top: 'Sea Salt, Ozonic', heart: 'Violet, Lotus', base: 'Driftwood, White Musk' },
      size: '100ml', gender: 'male', featured: false, rating: 4.3, reviews: 103,
    },
    {
      id: 'prod6', name: 'Persian Bouquet', category_id: 'cat1',
      price: 5499, original_price: 6999, stock: 35,
      image: '/images/perfume6.jpg',
      images: ['/images/perfume6.jpg', '/images/perfume1.jpg', '/images/perfume4.jpg'],
      description: 'Ancient Persian art distilled into fragrance. Oud, rose, and exotic spices weave a tapestry of legends.',
      notes: { top: 'Rose, Saffron', heart: 'Oud, Incense', base: 'Patchouli, Musk' },
      size: '75ml', gender: 'female', featured: true, rating: 4.7, reviews: 58,
    },
  ];

  for (const p of products) {
    await conn.query(
      `INSERT INTO products (id, name, category_id, price, original_price, stock, image, images, description, notes, size, gender, featured, rating, reviews)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.name, p.category_id, p.price, p.original_price, p.stock, p.image,
       JSON.stringify(p.images), p.description, JSON.stringify(p.notes), p.size,
       p.gender, p.featured ? 1 : 0, p.rating, p.reviews]
    );
  }
  console.log('✅ Products seeded (6)');

  // Seed admin user
  const adminPass = await bcrypt.hash('admin123', 12);
  await conn.query(
    'INSERT INTO users (id, name, email, password, role, addresses) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), 'Admin', 'admin@luxe.com', adminPass, 'admin', '[]']
  );
  console.log('✅ Admin user created (admin@luxe.com / admin123)');

  await conn.end();
  console.log('\n🎉 Database setup complete!\n');
  console.log('Now run: npm run dev');
}

setup().catch(err => {
  console.error('❌ Setup failed:', err);
  console.log('\n📝 Troubleshooting Steps:');
  console.log('   1. Verify MySQL is installed and RUNNING.');
  console.log('   2. Check if host, user, and password in .env.local are correct.');
  console.log('   3. If using XAMPP/WAMP, ensure the MySQL service is started.');
  process.exit(1);
});
