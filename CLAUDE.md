# CLAUDE.md — BaBaBook Backend Project Context

ไฟล์นี้บันทึกบริบทของโปรเจกต์สำหรับ AI Agent (Claude Code)  
เพื่อให้ทำงานต่อได้ทันทีโดยไม่ต้องสำรวจโค้ดซ้ำตั้งแต่ต้น

---

## โปรเจกต์คืออะไร

**BaBaBook** — Backend API สำหรับแอปร้านหนังสือ E-Commerce  
Frontend (React + Vite) รันที่ `http://localhost:5173`  
Backend (Node.js + Express) รันที่ `http://localhost:5000`  
Database: MySQL ผ่าน XAMPP (`bababook_db`)

---

## สถานะปัจจุบัน (2026-05-07)

### ✅ Implemented (ทำแล้ว ทดสอบผ่าน)

| # | Endpoint | Method | Auth |
|---|---|---|---|
| 1 | `/api/auth/register` | POST | Public |
| 2 | `/api/auth/login` | POST | Public |
| 3 | `/api/books` | GET | Public |
| 4 | `/api/books/:id` | GET | Public |
| 5 | `/api/books` | POST | Admin |
| 6 | `/api/books/:id` | PUT | Admin |
| 7 | `/api/books/:id` | DELETE | Admin |

### 🚧 In Progress (อยู่ระหว่างพัฒนา)

- `POST /api/cart/add` — Cart feature ยังไม่สมบูรณ์ ยังไม่ได้ test

---

## โครงสร้างไฟล์สำคัญ

```
index.js              ← Entry point
config/db.js          ← MySQL Connection Pool
middleware/
  authMiddleware.js   ← JWT protect + adminOnly
  upload.js           ← Multer (cover image, max 5MB, jpg/png/webp)
controllers/
  authController.js   ← register + login
  bookController.js   ← getBooks, getBookById, addBook, updateBook, deleteBook
  cartController.js   ← addToCart
services/
  cartService.js      ← getOrCreateCart, addToCart
routes/
  authRoutes.js       ← /api/auth/*
  bookRoutes.js       ← /api/books/*
  cart.js             ← /api/cart/*
database/
  init.sql            ← Schema + Seed (authoritative, ใช้สำหรับ fresh setup)
seed.js               ← Reseed script (รัน node seed.js)
uploads/covers/       ← รูปปกหนังสือที่อัพโหลด
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| username | VARCHAR(255) UNIQUE | |
| email | VARCHAR(255) UNIQUE | |
| password | VARCHAR(255) | bcrypt hash เท่านั้น |
| role | ENUM('user','admin') | default 'user' |
| level | INT | default 1, admin = 99 |
| created_at | TIMESTAMP | |

### `books`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| title | VARCHAR(255) NOT NULL | |
| author | VARCHAR(255) NOT NULL | |
| publisher | VARCHAR(255) NULL | |
| publish_year | INT NULL | |
| genre | ENUM(...) NOT NULL | 16 ค่า เช่น fantasy, romance, historical |
| synopsis | TEXT NULL | |
| cover_image_url | TEXT NULL | URL รูปปก |
| created_at | TIMESTAMP | |

### `book_variants`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| book_id | INT FK → books.id | ON DELETE CASCADE |
| type | ENUM('th','en','ebook') NOT NULL | |
| price | DECIMAL(10,2) NOT NULL | |
| stock | INT NOT NULL DEFAULT 0 | |
| (unique) | (book_id, type) | ห้ามซ้ำ type ในเล่มเดียวกัน |

### `carts`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| user_id | INT UNIQUE FK → users.id | 1 user = 1 cart |
| created_at | TIMESTAMP | |

### `cart_items`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| cart_id | INT FK → carts.id | ON DELETE CASCADE |
| variant_id | INT FK → book_variants.id | ไม่ใช่ book_id! |
| quantity | INT NOT NULL DEFAULT 1 | |
| created_at | TIMESTAMP | |

---

## Key Design Decisions

### Authentication
- JWT Token อายุ 30 วัน, เก็บ payload: `{ id, username, role, level }`
- `protect` middleware → ตรวจ Token → เก็บไว้ใน `req.user`
- `adminOnly` middleware → ต้องใช้ต่อจาก `protect` เสมอ

### File Upload (Cover Image)
- Multer diskStorage → บันทึกที่ `uploads/covers/`
- ชื่อไฟล์: `cover_{timestamp}.{ext}`
- URL ที่ส่งกลับ: `http://localhost:5000/uploads/covers/cover_xxx.jpg`
- ขนาดสูงสุด: 5MB | นามสกุล: jpg, png, webp

### Book Variants
- 1 Book มีหลาย Variant (th, en, ebook)
- ราคาและ stock แยกกันต่อ Variant
- `addBook` ใช้ Transaction: Insert book → Insert variants พร้อมกัน

### Cart
- `cart_items.variant_id` อ้างอิง `book_variants.id` (ไม่ใช่ `books.id`)
- 1 User = 1 Cart (UNIQUE constraint บน `carts.user_id`)
- `getOrCreateCart` สร้าง Cart อัตโนมัติถ้ายังไม่มี

---

## Environment Variables (.env)

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=          ← ว่างเปล่า (XAMPP default)
DB_NAME=bababook_db
JWT_SECRET=supersecretkeybababook2026
```

---

## Seed Accounts

| Email | Password | Role | Level |
|---|---|---|---|
| admin@example.com | password123 | admin | 99 |
| user1@example.com | password123 | user | 1 |

---

## คำสั่งที่ใช้บ่อย

```bash
# รัน Server
node index.js

# รีเซ็ตข้อมูลตัวอย่าง
node seed.js

# Init Database (fresh setup)
mysql -u root -p < database/init.sql

# ทดสอบ API เบื้องต้น
curl http://localhost:5000/api/books
```

---

## API Spec

รายละเอียด Request/Response ครบถ้วนอยู่ใน [api.md](api.md)
