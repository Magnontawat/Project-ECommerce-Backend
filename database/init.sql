-- สร้างฐานข้อมูล (ถ้ายังไม่มี)
CREATE DATABASE IF NOT EXISTS bababook_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- เลือกใช้ฐานข้อมูล
USE bababook_db;

-- สร้างตาราง books (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    cover TEXT,
    category VARCHAR(100),
    description TEXT
);

-- สร้างตาราง users (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('buyer', 'admin') DEFAULT 'buyer',
    level INT DEFAULT 1
);

-- ล้างข้อมูลเก่า
TRUNCATE TABLE books;
TRUNCATE TABLE users;

-- เพิ่มข้อมูลตัวอย่าง books
-- INSERT INTO books (title, author, price, cover, category, description) VALUES
-- ('The Weight of Ink', 'Rachel Kadish', 24.00, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80', 'Historical Fiction', 'A sweeping historical narrative set in London of the 1660s and of the early twenty-first century.'),
-- ('A Little Life', 'Hanya Yanagihara', 22.50, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', 'Contemporary Fiction', 'A novel about the lives of four college friends in New York City.'),
-- ('Pachinko', 'Min Jin Lee', 19.00, 'https://images.unsplash.com/photo-1629992101753-56d196c8aabb?w=400&q=80', 'Historical Fiction', 'A multi-generational saga of a Korean family who eventually migrate to Japan.');

-- -- เพิ่มข้อมูลตัวอย่าง users (รหัสผ่านคือ password123 เข้ารหัสผ่าน bcrypt)
-- -- INSERT INTO users (username, password, role, level) VALUES
-- -- ('admin', '$2a$10$Xm30u/t7V3k/wG./L7q28u/X8mU6y728v4oM1q5H6wXz0K.nQoB2a', 'admin', 99),
-- -- ('buyer1', '$2a$10$Xm30u/t7V3k/wG./L7q28u/X8mU6y728v4oM1q5H6wXz0K.nQoB2a', 'buyer', 1);
