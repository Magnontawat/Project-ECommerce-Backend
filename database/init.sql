SET FOREIGN_KEY_CHECKS = 0;

-- สร้างฐานข้อมูล (ถ้ายังไม่มี)
CREATE DATABASE IF NOT EXISTS bababook_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- เลือกใช้ฐานข้อมูล
USE bababook_db;

-- ล้างตารางเก่า (ตามลำดับ FK)
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS book_variants;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;

-- =============================================
-- ตาราง books
-- =============================================
CREATE TABLE books (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(255)    NOT NULL,
    author          VARCHAR(255)    NOT NULL,
    publisher       VARCHAR(255)    NULL,
    publish_year    INT             NULL,
    genre           ENUM(
                        'fantasy','romance','thriller','mystery','horror',
                        'sci-fi','historical','adventure','drama','comedy',
                        'young-adult','literary','action','BL','GL','other'
                    ) NOT NULL DEFAULT 'other',
    synopsis        TEXT            NULL,
    cover_image_url TEXT            NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ตาราง book_variants
-- =============================================
CREATE TABLE book_variants (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT             NOT NULL,
    type    ENUM('th','en','ebook') NOT NULL,
    price   DECIMAL(10, 2)  NOT NULL,
    stock   INT             NOT NULL DEFAULT 0,
    UNIQUE KEY uq_book_variant (book_id, type),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- =============================================
-- ตาราง users
-- =============================================
CREATE TABLE users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(255)            UNIQUE NOT NULL,
    email       VARCHAR(255)            UNIQUE NOT NULL,
    password    VARCHAR(255)            NOT NULL,
    role        ENUM('user','admin')    DEFAULT 'user',
    level       INT                     DEFAULT 1,
    created_at  TIMESTAMP               DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ตาราง carts
-- =============================================
CREATE TABLE carts (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT     UNIQUE NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- ตาราง cart_items
-- =============================================
CREATE TABLE cart_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    cart_id     INT NOT NULL,
    variant_id  INT NOT NULL,
    quantity    INT NOT NULL DEFAULT 1,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id)   REFERENCES carts(id)         ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES book_variants(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- Seed Data: users
-- รหัสผ่านของทุก account คือ: password123
-- hash ด้วย bcrypt rounds=10
-- =============================================
INSERT INTO users (username, email, password, role, level) VALUES
('admin',  'admin@example.com',  '$2b$10$1GagAGuq75NHiBcQftdXE.ijA9nfsNkIEPycXDZt5ubpyT8FpFawm', 'admin', 99),
('user1',  'user1@example.com',  '$2b$10$1GagAGuq75NHiBcQftdXE.ijA9nfsNkIEPycXDZt5ubpyT8FpFawm', 'user',  1);

-- =============================================
-- Seed Data: books
-- =============================================
INSERT INTO books (title, author, publisher, publish_year, genre, synopsis, cover_image_url) VALUES
(
    'The Weight of Ink',
    'Rachel Kadish',
    'Houghton Mifflin Harcourt',
    2017,
    'historical',
    'A sweeping historical narrative set in London of the 1660s and of the early twenty-first century.',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80'
),
(
    'A Little Life',
    'Hanya Yanagihara',
    'Doubleday',
    2015,
    'literary',
    'A novel about the lives of four college friends navigating friendship, loss, and trauma in New York City.',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80'
),
(
    'Pachinko',
    'Min Jin Lee',
    'Grand Central Publishing',
    2017,
    'historical',
    'A multi-generational saga of a Korean family who eventually migrate to Japan, spanning nearly a century.',
    'https://images.unsplash.com/photo-1629992101753-56d196c8aabb?w=400&q=80'
);

-- =============================================
-- Seed Data: book_variants
-- =============================================
INSERT INTO book_variants (book_id, type, price, stock) VALUES
-- The Weight of Ink
(1, 'th',    320.00, 50),
(1, 'en',    450.00, 30),
(1, 'ebook', 149.00, 999),
-- A Little Life
(2, 'th',    280.00, 40),
(2, 'ebook', 129.00, 999),
-- Pachinko
(3, 'th',    299.00, 35),
(3, 'en',    420.00, 20),
(3, 'ebook', 139.00, 999);