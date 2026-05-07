-- =============================================================
-- database/init.sql — สคริปต์สร้างฐานข้อมูล BaBaBook
-- =============================================================
--
-- วิธีใช้งาน:
--   mysql -u root -p < database/init.sql
--
-- สคริปต์นี้จะ:
--   1. สร้าง Database (ถ้ายังไม่มี)
--   2. ลบตารางเก่าทั้งหมดแล้วสร้างใหม่ (ข้อมูลเดิมจะหายทั้งหมด)
--   3. ใส่ข้อมูลตัวอย่าง (Seed Data) พร้อมใช้งานทันที
--
-- ⚠️  คำเตือน: อย่ารันบน Production เพราะจะลบข้อมูลทั้งหมด
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0; -- ปิดการตรวจสอบ FK ชั่วคราวเพื่อให้ DROP TABLE ทำงานได้

-- สร้าง Database ถ้ายังไม่มี
CREATE DATABASE IF NOT EXISTS bababook_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci; -- รองรับภาษาไทยและ Emoji

USE bababook_db;

-- ล้างตารางเก่า (เรียงตาม FK: ลูกก่อน แม่หลัง)
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS book_variants;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;

-- =============================================================
-- ตาราง users — ข้อมูลผู้ใช้งาน
-- =============================================================
CREATE TABLE users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(255)         UNIQUE NOT NULL,  -- ชื่อผู้ใช้ (ห้ามซ้ำ)
    email      VARCHAR(255)         UNIQUE NOT NULL,  -- อีเมล (ห้ามซ้ำ)
    password   VARCHAR(255)         NOT NULL,         -- bcrypt hash เท่านั้น ห้ามเก็บ plain text
    role       ENUM('user','admin') DEFAULT 'user',   -- สิทธิ์: user = ลูกค้า, admin = ผู้ดูแล
    level      INT                  DEFAULT 1,        -- ระดับของผู้ใช้ (admin = 99)
    created_at TIMESTAMP            DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- ตาราง books — ข้อมูลหนังสือ
-- =============================================================
CREATE TABLE books (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    author          VARCHAR(255) NOT NULL,
    publisher       VARCHAR(255) NULL,       -- ชื่อสำนักพิมพ์ (optional)
    publish_year    INT          NULL,       -- ปีที่พิมพ์ เช่น 2023 (optional)
    genre           ENUM(
                        'fantasy','romance','thriller','mystery','horror',
                        'sci-fi','historical','adventure','drama','comedy',
                        'young-adult','literary','action','BL','GL','other'
                    ) NOT NULL DEFAULT 'other',
    synopsis        TEXT         NULL,       -- เรื่องย่อ (optional)
    cover_image_url TEXT         NULL,       -- URL รูปปก (เก็บหลังจากอัพโหลดไฟล์แล้ว)
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- ตาราง book_variants — ประเภทฉบับของหนังสือแต่ละเล่ม
-- =============================================================
-- หนังสือ 1 เล่ม มีได้หลาย variant เช่น ฉบับภาษาไทย, ภาษาอังกฤษ, eBook
-- แต่ละ variant มีราคาและสต็อกแยกกัน
CREATE TABLE book_variants (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT                      NOT NULL,
    type    ENUM('th','en','ebook')   NOT NULL, -- th=ภาษาไทย, en=ภาษาอังกฤษ, ebook=ดิจิทัล
    price   DECIMAL(10, 2)           NOT NULL,
    stock   INT                      NOT NULL DEFAULT 0,

    -- ป้องกันไม่ให้หนังสือเล่มเดียวกันมี type ซ้ำ เช่น มี 2 ฉบับภาษาไทย
    UNIQUE KEY uq_book_variant (book_id, type),

    -- เมื่อลบหนังสือ → ลบ variants ทั้งหมดของหนังสือนั้นด้วย
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- =============================================================
-- ตาราง carts — ตะกร้าสินค้า (1 User = 1 ตะกร้า)
-- =============================================================
CREATE TABLE carts (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNIQUE NOT NULL, -- UNIQUE = แต่ละ User มีตะกร้าได้แค่ 1 ใบ
    created_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,

    -- เมื่อลบ User → ลบตะกร้าของ User นั้นด้วย
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- ตาราง cart_items — รายการสินค้าในตะกร้า
-- =============================================================
CREATE TABLE cart_items (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    cart_id    INT NOT NULL,
    variant_id INT NOT NULL, -- อ้างอิง book_variants (ไม่ใช่ books โดยตรง)
    quantity   INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    -- เมื่อลบตะกร้า → ลบรายการสินค้าในตะกร้านั้นด้วย
    FOREIGN KEY (cart_id)    REFERENCES carts(id)         ON DELETE CASCADE,

    -- เมื่อลบ variant → ลบรายการสินค้าที่อ้างอิง variant นั้นด้วย
    FOREIGN KEY (variant_id) REFERENCES book_variants(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1; -- เปิดการตรวจสอบ FK กลับคืน

-- =============================================================
-- Seed Data — ข้อมูลตัวอย่างสำหรับทดสอบ
-- =============================================================

-- ── Users ──────────────────────────────────────────────────
-- รหัสผ่านของทุก account คือ: password123
-- (hash ด้วย bcrypt rounds=10)
INSERT INTO users (username, email, password, role, level) VALUES
('admin', 'admin@example.com', '$2b$10$1GagAGuq75NHiBcQftdXE.ijA9nfsNkIEPycXDZt5ubpyT8FpFawm', 'admin', 99),
('user1', 'user1@example.com', '$2b$10$1GagAGuq75NHiBcQftdXE.ijA9nfsNkIEPycXDZt5ubpyT8FpFawm', 'user',  1);

-- ── Books ───────────────────────────────────────────────────
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

-- ── Book Variants ───────────────────────────────────────────
-- book_id 1: The Weight of Ink
INSERT INTO book_variants (book_id, type, price, stock) VALUES
(1, 'th',    320.00, 50),
(1, 'en',    450.00, 30),
(1, 'ebook', 149.00, 999);

-- book_id 2: A Little Life
INSERT INTO book_variants (book_id, type, price, stock) VALUES
(2, 'th',    280.00, 40),
(2, 'ebook', 129.00, 999);

-- book_id 3: Pachinko
INSERT INTO book_variants (book_id, type, price, stock) VALUES
(3, 'th',    299.00, 35),
(3, 'en',    420.00, 20),
(3, 'ebook', 139.00, 999);
