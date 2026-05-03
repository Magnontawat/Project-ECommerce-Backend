SET FOREIGN_KEY_CHECKS = 0;

-- สร้างฐานข้อมูล (ถ้ายังไม่มี)
CREATE DATABASE IF NOT EXISTS bababook_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- เลือกใช้ฐานข้อมูล
USE bababook_db;

-- ล้างตารางเก่า (ถ้ามี)
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;

-- สร้างตาราง books
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    cover TEXT,
    category VARCHAR(100),
    description TEXT,
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('buyer', 'admin') DEFAULT 'buyer',
    level INT DEFAULT 1
);

-- สร้างตาราง carts
CREATE TABLE carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- สร้างตาราง cart_items
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    book_id INT NOT NULL,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;

-- เพิ่มข้อมูลตัวอย่าง books
INSERT INTO books (title, author, price, cover, category, description, stock) VALUES
('The Weight of Ink', 'Rachel Kadish', 24.00, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80', 'Historical Fiction', 'A sweeping historical narrative set in London of the 1660s and of the early twenty-first century.', 50),
('A Little Life', 'Hanya Yanagihara', 22.50, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', 'Contemporary Fiction', 'A novel about the lives of four college friends in New York City.', 30),
('Pachinko', 'Min Jin Lee', 19.00, 'https://images.unsplash.com/photo-1629992101753-56d196c8aabb?w=400&q=80', 'Historical Fiction', 'A multi-generational saga of a Korean family who eventually migrate to Japan.', 40);

-- เพิ่มข้อมูลตัวอย่าง users (รหัสผ่านคือ password123 เข้ารหัสผ่าน bcrypt)
INSERT INTO users (username, email, password, role, level) VALUES
('admin', 'admin@example.com', '$2b$10$1GagAGuq75NHiBcQftdXE.ijA9nfsNkIEPycXDZt5ubpyT8FpFawm', 'admin', 99),
('buyer1', 'buyer1@example.com', '$2b$10$1GagAGuq75NHiBcQftdXE.ijA9nfsNkIEPycXDZt5ubpyT8FpFawm', 'buyer', 1);