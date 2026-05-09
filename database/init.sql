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
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
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
    is_active       TINYINT(1)   NOT NULL DEFAULT 1, -- 1=แสดง, 0=ซ่อน (soft delete)
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
    stock   INT                      NULL DEFAULT 0,

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

    FOREIGN KEY (cart_id)    REFERENCES carts(id)         ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES book_variants(id) ON DELETE CASCADE
);

-- =============================================================
-- ตาราง orders — คำสั่งซื้อ
-- =============================================================
-- 1 คำสั่งซื้อ = 1 แถวใน orders + หลายแถวใน order_items
-- status: pending=รอดำเนินการ, paid=ชำระแล้ว, cancelled=ยกเลิก
CREATE TABLE orders (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT                                  NOT NULL,
    status      ENUM('pending','paid','cancelled')   NOT NULL DEFAULT 'pending',
    total_price DECIMAL(10, 2)                       NOT NULL, -- ยอดรวมทั้งหมด ณ เวลาสั่งซื้อ
    created_at  TIMESTAMP                            DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- ตาราง order_items — รายการสินค้าในคำสั่งซื้อ
-- =============================================================
-- price_at_purchase เก็บราคา ณ วันที่สั่งซื้อ เพราะราคา variant อาจเปลี่ยนในภายหลัง
CREATE TABLE order_items (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    order_id          INT            NOT NULL,
    variant_id        INT            NOT NULL,
    quantity          INT            NOT NULL,
    price_at_purchase DECIMAL(10, 2) NOT NULL, -- snapshot ราคา ณ วันที่สั่งซื้อ

    FOREIGN KEY (order_id)   REFERENCES orders(id)        ON DELETE CASCADE,
    -- RESTRICT: ห้ามลบ variant ถ้ายังมีประวัติคำสั่งซื้ออยู่ (ป้องกันข้อมูลเสียหาย)
    FOREIGN KEY (variant_id) REFERENCES book_variants(id) ON DELETE RESTRICT
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
('user1', 'user1@example.com', '$2b$10$1GagAGuq75NHiBcQftdXE.ijA9nfsNkIEPycXDZt5ubpyT8FpFawm', 'user',   1);

-- ── Books (10 เล่ม) ─────────────────────────────────────────
INSERT INTO books (title, author, publisher, publish_year, genre, synopsis, cover_image_url) VALUES
-- book_id 1
(
    'The Weight of Ink',
    'Rachel Kadish',
    'Houghton Mifflin Harcourt',
    2017,
    'historical',
    'A sweeping historical narrative set in London of the 1660s and of the early twenty-first century.',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80'
),
-- book_id 2
(
    'A Little Life',
    'Hanya Yanagihara',
    'Doubleday',
    2015,
    'literary',
    'A novel about the lives of four college friends navigating friendship, loss, and trauma in New York City.',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80'
),
-- book_id 3
(
    'Pachinko',
    'Min Jin Lee',
    'Grand Central Publishing',
    2017,
    'historical',
    'A multi-generational saga of a Korean family who eventually migrate to Japan, spanning nearly a century.',
    'https://images.unsplash.com/photo-1629992101753-56d196c8aabb?w=400&q=80'
),
-- book_id 4
(
    'The Name of the Wind',
    'Patrick Rothfuss',
    'DAW Books',
    2007,
    'fantasy',
    'The story of Kvothe, a legendary wizard who grows from a poor troupe performer to the most notorious wizard his world has ever seen.',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80'
),
-- book_id 5
(
    'The Fault in Our Stars',
    'John Green',
    'Dutton Books',
    2012,
    'romance',
    'Two teenagers, Hazel and Augustus, meet in a cancer support group and fall in love, embarking on a journey that is both funny and heartbreaking.',
    'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&q=80'
),
-- book_id 6
(
    'Gone Girl',
    'Gillian Flynn',
    'Crown Publishers',
    2012,
    'thriller',
    'On their fifth anniversary, Nick Dunne''s wife Amy mysteriously disappears. As the media descends, the evidence begins to point directly at Nick.',
    'https://images.unsplash.com/photo-1476275466078-4cdc8bd9e5e4?w=400&q=80'
),
-- book_id 7
(
    'Dune',
    'Frank Herbert',
    'Chilton Books',
    1965,
    'sci-fi',
    'Set in the distant future amidst a feudal interstellar society, Dune tells the story of Paul Atreides as his family accepts stewardship of the desert planet Arrakis.',
    'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&q=80'
),
-- book_id 8
(
    'It',
    'Stephen King',
    'Viking Press',
    1986,
    'horror',
    'A terrifying clown named Pennywise haunts the town of Derry, Maine, preying on children every 27 years. A group of childhood friends must face their darkest fears to stop it.',
    'https://images.unsplash.com/photo-1509266272358-7701da638078?w=400&q=80'
),
-- book_id 9
(
    'The Alchemist',
    'Paulo Coelho',
    'HarperCollins',
    1988,
    'adventure',
    'A young Andalusian shepherd named Santiago travels from Spain to Egypt in search of treasure, discovering along the way the importance of following one''s dreams.',
    'https://images.unsplash.com/photo-1465929639680-64ee080eb3ed?w=400&q=80'
),
-- book_id 10
(
    'Norwegian Wood',
    'Haruki Murakami',
    'Kodansha',
    1987,
    'literary',
    'A nostalgic story of loss and sexuality, following Toru Watanabe as he looks back on his days as a college student living in Tokyo in the late 1960s.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'
);

-- ── Book Variants ───────────────────────────────────────────
-- stock = NULL สำหรับ ebook (ไม่จำกัดจำนวน)
--
-- variant_id 1-3:   The Weight of Ink      (th, en, ebook)
-- variant_id 4-5:   A Little Life          (th, ebook)
-- variant_id 6-8:   Pachinko               (th, en, ebook)
-- variant_id 9-11:  The Name of the Wind   (th, en, ebook)
-- variant_id 12-13: The Fault in Our Stars (th, ebook)
-- variant_id 14-16: Gone Girl              (th, en, ebook)
-- variant_id 17-19: Dune                   (th, en, ebook)
-- variant_id 20-21: It                     (th, ebook)
-- variant_id 22-24: The Alchemist          (th, en, ebook)
-- variant_id 25-27: Norwegian Wood         (th, en, ebook)

INSERT INTO book_variants (book_id, type, price, stock) VALUES
-- The Weight of Ink (book_id 1)
(1, 'th',    320.00,  50),
(1, 'en',    450.00,  30),
(1, 'ebook', 149.00, NULL),
-- A Little Life (book_id 2)
(2, 'th',    280.00,  40),
(2, 'ebook', 129.00, NULL),
-- Pachinko (book_id 3)
(3, 'th',    299.00,  35),
(3, 'en',    420.00,  20),
(3, 'ebook', 139.00, NULL),
-- The Name of the Wind (book_id 4)
(4, 'th',    350.00,  45),
(4, 'en',    480.00,  25),
(4, 'ebook', 169.00, NULL),
-- The Fault in Our Stars (book_id 5)
(5, 'th',    260.00,  60),
(5, 'ebook', 119.00, NULL),
-- Gone Girl (book_id 6)
(6, 'th',    310.00,  35),
(6, 'en',    430.00,  15),
(6, 'ebook', 159.00, NULL),
-- Dune (book_id 7)
(7, 'th',    390.00,  30),
(7, 'en',    520.00,  20),
(7, 'ebook', 189.00, NULL),
-- It (book_id 8)
(8, 'th',    420.00,  25),
(8, 'ebook', 179.00, NULL),
-- The Alchemist (book_id 9)
(9, 'th',    240.00,  70),
(9, 'en',    360.00,  40),
(9, 'ebook', 109.00, NULL),
-- Norwegian Wood (book_id 10)
(10, 'th',    290.00,  45),
(10, 'en',    400.00,  30),
(10, 'ebook', 139.00, NULL);

-- ── Cart (user1) ────────────────────────────────────────────
-- สร้างตะกร้าให้ user1 (user_id=2) และเพิ่มสินค้าตัวอย่าง
-- ใช้สำหรับทดสอบ GET /api/cart โดยไม่ต้อง add เอง
INSERT INTO carts (user_id) VALUES (2); -- cart_id = 1

INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES
(1, 4,  1),  -- A Little Life (th) x1
(1, 11, 2);  -- The Name of the Wind (ebook) x2

-- ── Orders (user1) ──────────────────────────────────────────
-- ประวัติคำสั่งซื้อตัวอย่างสำหรับทดสอบ Order History
-- order_id = 1: คำสั่งซื้อที่ชำระแล้ว
INSERT INTO orders (user_id, status, total_price) VALUES
(2, 'paid', 737.00); -- 320.00 + 139.00*3 = 737.00

INSERT INTO order_items (order_id, variant_id, quantity, price_at_purchase) VALUES
(1, 1, 1, 320.00),  -- The Weight of Ink (th) x1 @ 320 บาท
(1, 8, 3, 139.00);  -- Pachinko (ebook) x3 @ 139 บาท
