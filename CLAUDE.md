# CLAUDE.md — BaBaBook Backend

ไฟล์นี้ให้บริบทสำหรับ AI Agent เพื่อให้เริ่มงานได้ทันทีโดยไม่ต้องสำรวจโค้ดซ้ำ

---

## โปรเจกต์คืออะไร

**BaBaBook** — REST API Backend สำหรับแอปร้านหนังสือ E-Commerce

| | URL |
|---|---|
| Frontend (React + Vite) | `http://localhost:5173` |
| Backend (Node.js + Express) | `http://localhost:5000` |
| Database | MySQL ผ่าน XAMPP — database: `bababook_db` |

---

## Tech Stack & Dependencies

```
Node.js + Express
mysql2/promise   — ติดต่อ MySQL ด้วย Connection Pool
bcryptjs         — hash password
jsonwebtoken     — สร้าง/ตรวจสอบ JWT
multer           — รับ file upload (รูปปก)
cors             — อนุญาต Frontend localhost:5173
dotenv           — โหลด .env
```

---

## Quick Start

```bash
# รัน Server
node index.js

# Reset ข้อมูล (fresh setup)
# phpMyAdmin → เลือก bababook_db → Import → database/init.sql → Go

# ทดสอบ API
curl http://localhost:5000/api/books
```

---

## Endpoints ทั้งหมด (ครบแล้ว — ไม่มี TODO)

| # | Method | Endpoint | Auth | Controller |
|---|---|---|---|---|
| 1 | POST | `/api/auth/register` | Public | registerUser |
| 2 | POST | `/api/auth/login` | Public | loginUser |
| 3 | GET | `/api/books` | Public | getBooks |
| 4 | GET | `/api/books/:id` | Public | getBookById |
| 5 | POST | `/api/books` | Admin | addBook |
| 6 | PUT | `/api/books/:id` | Admin | updateBook |
| 7 | DELETE | `/api/books/:id` | Admin | deleteBook |
| 8 | POST | `/api/cart/add` | User | addToCart |
| 9 | GET | `/api/cart` | User | getCart |
| 10 | DELETE | `/api/cart/items/:id` | User | removeCartItem |
| 11 | PUT | `/api/cart/items/:id` | User | updateCartItem |
| 12 | POST | `/api/orders` | User | createOrder |
| 13 | GET | `/api/orders` | User | getOrders |
| 14 | GET | `/api/orders/:id` | User | getOrderById |

---

## โครงสร้างไฟล์

```
index.js                  ← Entry point (Express app + routes)
.env                      ← Environment variables
config/
  db.js                   ← MySQL Connection Pool
middleware/
  authMiddleware.js        ← protect (JWT) + adminOnly
  upload.js               ← Multer config (cover image, max 5MB, jpg/png/webp)
controllers/
  authController.js        ← register, login
  bookController.js        ← getBooks, getBookById, addBook, updateBook, deleteBook
  cartController.js        ← addToCart, getCart, removeCartItem, updateCartItem
  orderController.js       ← createOrder, getOrders, getOrderById
services/
  cartService.js           ← getOrCreateCart, addToCart (business logic)
routes/
  authRoutes.js            ← /api/auth/*
  bookRoutes.js            ← /api/books/*
  cart.js                  ← /api/cart/*
  orderRoutes.js           ← /api/orders/*
database/
  init.sql                 ← Schema + Seed data (authoritative — ใช้ import ผ่าน phpMyAdmin)
uploads/covers/            ← รูปปกที่ upload แล้ว
spec/
  api.md                   ← API spec ครบถ้วน (request/response ทุก endpoint)
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| username | VARCHAR(255) UNIQUE NOT NULL | |
| email | VARCHAR(255) UNIQUE NOT NULL | |
| password | VARCHAR(255) NOT NULL | bcrypt hash เท่านั้น — ห้ามเก็บ plain text |
| role | ENUM('user','admin') | default 'user' |
| level | INT | default 1 / admin = 99 |
| created_at | TIMESTAMP | |

### `books`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| title | VARCHAR(255) NOT NULL | |
| author | VARCHAR(255) NOT NULL | |
| publisher | VARCHAR(255) NULL | |
| publish_year | INT NULL | |
| genre | ENUM(...) NOT NULL | 16 ค่า: fantasy, romance, thriller, mystery, horror, sci-fi, historical, adventure, drama, comedy, young-adult, literary, action, BL, GL, other |
| synopsis | TEXT NULL | |
| cover_image_url | TEXT NULL | |
| is_active | TINYINT(1) NOT NULL DEFAULT 1 | Soft Delete: 1=แสดง, 0=ซ่อน |
| created_at | TIMESTAMP | |

### `book_variants`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| book_id | INT FK → books.id | ON DELETE CASCADE |
| type | ENUM('th','en','ebook') NOT NULL | |
| price | DECIMAL(10,2) NOT NULL | |
| stock | INT NULL DEFAULT 0 | ebook = null (ไม่จำกัด) / th,en = ตัวเลขจริง |
| UNIQUE | (book_id, type) | ห้ามซ้ำ type ในเล่มเดียวกัน |

### `carts`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| user_id | INT UNIQUE FK → users.id | 1 user = 1 cart (ON DELETE CASCADE) |
| created_at | TIMESTAMP | |

### `cart_items`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| cart_id | INT FK → carts.id | ON DELETE CASCADE |
| variant_id | INT FK → book_variants.id | ON DELETE CASCADE — อ้างอิง variant ไม่ใช่ book |
| quantity | INT NOT NULL DEFAULT 1 | |
| created_at | TIMESTAMP | |

### `orders`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| user_id | INT FK → users.id | ON DELETE CASCADE |
| status | ENUM('pending','paid','cancelled') | default 'pending' |
| total_price | DECIMAL(10,2) NOT NULL | snapshot ยอดรวม ณ เวลา checkout |
| created_at | TIMESTAMP | |

### `order_items`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| order_id | INT FK → orders.id | ON DELETE CASCADE |
| variant_id | INT FK → book_variants.id | **ON DELETE RESTRICT** — ห้ามลบ variant ที่มี order อ้างอิง |
| quantity | INT NOT NULL | |
| price_at_purchase | DECIMAL(10,2) NOT NULL | snapshot ราคา ณ วันสั่งซื้อ |

---

## Key Design Decisions

### Authentication
- JWT payload: `{ id, username, role, level }` / อายุ 30 วัน
- `protect` → ถอดรหัส Token → เก็บใน `req.user`
- `adminOnly` → ตรวจ `req.user.role === 'admin'` → ต้องใช้ต่อจาก `protect` เสมอ
- `role` มีแค่ `"user"` และ `"admin"` (ไม่มี `"buyer"`)
- Email/Username ซ้ำ → **409** (ไม่ใช่ 400)
- Email ไม่พบ → **404** / Password ผิด → **401**

### Books — Soft Delete
- `DELETE /api/books/:id` → `UPDATE books SET is_active = 0` (ไม่ลบจริง)
- เหตุผล: `order_items.variant_id` มี `ON DELETE RESTRICT` → ลบ variant จริงไม่ได้ถ้ามี order
- `GET /api/books` และ `GET /api/books/:id` filter เฉพาะ `is_active = 1` เสมอ
- หนังสือ soft-deleted → GET คืน 404 เหมือนไม่มีอยู่

### Books — Variants
- `addBook` / `updateBook` ใช้ `multipart/form-data` (รองรับ upload รูป)
- `variants` field ส่งเป็น **JSON string** (Frontend ต้อง `JSON.stringify`)
- `addBook` ใช้ Transaction: Insert book + Insert variants พร้อมกัน
- `updateBook` variants ใช้ **Smart Upsert**:
  - type เดิมที่ยังอยู่ → UPDATE
  - type ใหม่ → INSERT
  - type ที่หายไป → ตรวจ order_items ก่อน → ถ้ามี order → **409** / ถ้าไม่มี → DELETE
- stock ของ ebook = `null` เสมอ (ไม่จำกัดจำนวน)

### Cart
- ส่ง `variantId` (ID ของ `book_variants`) ไม่ใช่ `bookId`
- 1 User = 1 Cart (`getOrCreateCart` สร้างอัตโนมัติถ้ายังไม่มี)
- Add to cart: ถ้า variant นั้นอยู่ในตะกร้าแล้ว → **บวกจำนวน** (ไม่ใช่ replace)

### Orders
- `price_at_purchase` = snapshot ราคา ณ วันสั่งซื้อ (ไม่เปลี่ยนแม้ราคา variant จะถูกแก้ไขทีหลัง)
- `total_price` ใน orders คำนวณตอน checkout และเก็บเป็น snapshot เช่นกัน

### File Upload
- Multer → `uploads/covers/cover_{timestamp}.{ext}`
- URL: `http://localhost:5000/uploads/covers/cover_xxx.jpg`
- ขนาดสูงสุด: 5MB / นามสกุล: jpg, png, webp

---

## Environment Variables (.env)

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=bababook_db
JWT_SECRET=supersecretkeybababook2026
```

---

## Seed Data (หลัง import init.sql)

### Accounts

| Email | Password | Role | Level |
|---|---|---|---|
| admin@example.com | password123 | admin | 99 |
| user1@example.com | password123 | user | 1 |

### Books (10 เล่ม)

| book_id | Title | Genre | Variants |
|---|---|---|---|
| 1 | The Weight of Ink | historical | th(1), en(2), ebook(3) |
| 2 | A Little Life | literary | th(4), ebook(5) |
| 3 | Pachinko | historical | th(6), en(7), ebook(8) |
| 4 | The Name of the Wind | fantasy | th(9), en(10), ebook(11) |
| 5 | The Fault in Our Stars | romance | th(12), ebook(13) |
| 6 | Gone Girl | thriller | th(14), en(15), ebook(16) |
| 7 | Dune | sci-fi | th(17), en(18), ebook(19) |
| 8 | It | horror | th(20), ebook(21) |
| 9 | The Alchemist | adventure | th(22), en(23), ebook(24) |
| 10 | Norwegian Wood | literary | th(25), en(26), ebook(27) |

> ตัวเลขในวงเล็บ = variant_id ที่ใช้ทดสอบ Cart/Order
> **variant_id เหล่านี้ valid เฉพาะหลัง fresh import init.sql เท่านั้น**

### Cart & Orders ของ user1

- **cart_id 1**: A Little Life (th, variant_id=4) x1 + The Name of the Wind (ebook, variant_id=11) x2
- **order_id 1** (paid): The Weight of Ink (th) x1 @ 320 + Pachinko (ebook) x3 @ 139 = **737 บาท**

---

## สิ่งที่ AI ต้องระวัง

- `cart_items.variant_id` อ้างอิง **variant** ไม่ใช่ book → อย่าส่ง bookId เข้า cart
- `DELETE /api/books/:id` เป็น Soft Delete เสมอ → ห้ามเปลี่ยนเป็น hard delete
- `updateBook` ต้องใช้ Smart Upsert เสมอ → ห้ามลบ variants ทิ้งทั้งหมดแล้ว insert ใหม่ (จะ crash ถ้ามี order)
- `addBook` / `updateBook` ใช้ `multipart/form-data` ไม่ใช่ JSON
- ebook stock ต้องเป็น `null` เสมอ (ห้ามเป็น 0 หรือตัวเลข)
- Admin middleware chain: `protect` ก่อน แล้วค่อย `adminOnly` เสมอ
- `role` มีแค่ `"user"` กับ `"admin"` — ห้ามใช้ค่าอื่น

---

## อ่านเพิ่มเติม

API request/response ครบถ้วน → [spec/api.md](spec/api.md)
