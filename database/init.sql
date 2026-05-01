-- สร้างฐานข้อมูล (ถ้ายังไม่มี)
CREATE DATABASE IF NOT EXISTS bababook_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- เลือกใช้ฐานข้อมูล
USE bababook_db;

-- -- สร้างตาราง books (ถ้ายังไม่มี)
-- CREATE TABLE IF NOT EXISTS books (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     title VARCHAR(255) NOT NULL,
--     author VARCHAR(255) NOT NULL,
--     price DECIMAL(10, 2) NOT NULL,
--     cover TEXT,
--     category VARCHAR(100),
--     description TEXT
-- );

-- -- ล้างข้อมูลเก่า (เผื่อมีการรันสคริปต์ซ้ำ จะได้ไม่ซ้ำซ้อน)
-- TRUNCATE TABLE books;

-- -- เพิ่มข้อมูลตัวอย่าง (Mock Data)
-- INSERT INTO books (title, author, price, cover, category, description) VALUES
-- ('The Weight of Ink', 'Rachel Kadish', 24.00, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80', 'Historical Fiction', 'A sweeping historical narrative set in London of the 1660s and of the early twenty-first century.'),
-- ('A Little Life', 'Hanya Yanagihara', 22.50, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', 'Contemporary Fiction', 'A novel about the lives of four college friends in New York City.'),
-- ('Pachinko', 'Min Jin Lee', 19.00, 'https://images.unsplash.com/photo-1629992101753-56d196c8aabb?w=400&q=80', 'Historical Fiction', 'A multi-generational saga of a Korean family who eventually migrate to Japan.');
