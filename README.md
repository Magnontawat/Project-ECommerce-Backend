# BaBaBook — Backend API

Backend API สำหรับแอปพลิเคชัน E-Commerce ร้านหนังสือ BaBaBook  
สร้างด้วย Node.js + Express + MySQL

---

## Tech Stack

| เทคโนโลยี | เวอร์ชัน | หน้าที่ |
|---|---|---|
| Node.js | ≥ 18 | Runtime |
| Express | ^5 | Web Framework |
| MySQL | 8+ | Database (ผ่าน XAMPP) |
| mysql2 | ^3 | MySQL Driver (Promise) |
| bcryptjs | ^3 | เข้ารหัส Password |
| jsonwebtoken | ^9 | สร้างและตรวจสอบ JWT Token |
| multer | ^1 | รับไฟล์อัพโหลด (รูปปกหนังสือ) |
| dotenv | ^17 | โหลด Environment Variables |
| cors | ^2 | อนุญาต Frontend เรียก API |

---

## โครงสร้างโปรเจกต์

```
Project-ECommerce-Backend/
│
├── index.js                  ← Entry point (เริ่มต้น Server)
│
├── config/
│   └── db.js                 ← เชื่อมต่อ MySQL Connection Pool
│
├── controllers/              ← รับ Request → ประมวลผล → ส่ง Response
│   ├── authController.js     ← Register / Login
│   ├── bookController.js     ← CRUD หนังสือ
│   ├── cartController.js     ← ตะกร้าสินค้า
│   └── orderController.js    ← คำสั่งซื้อ (User + Admin)
│
├── middleware/               ← ทำงานก่อนถึง Controller
│   ├── authMiddleware.js     ← ตรวจ JWT Token และ Admin Role
│   └── upload.js             ← รับไฟล์รูปภาพด้วย Multer
│
├── routes/                   ← กำหนด URL ของแต่ละ Endpoint
│   ├── authRoutes.js         ← /api/auth/*
│   ├── bookRoutes.js         ← /api/books/*
│   ├── cart.js               ← /api/cart/*
│   └── orderRoutes.js        ← /api/orders/*
│
├── services/
│   └── cartService.js        ← Business Logic ของ Cart
│
├── database/
│   └── init.sql              ← สร้างตาราง + Seed Data (รันครั้งแรกหรือรีเซ็ต)
│
├── spec/
│   └── api.md                ← API Spec ครบถ้วน (Request/Response ทุก Endpoint)
│
├── uploads/
│   └── covers/               ← เก็บไฟล์รูปปกหนังสือที่อัพโหลด
│
├── .env                      ← Environment Variables (ไม่ commit ขึ้น Git)
├── .gitignore
└── package.json
```

---

## การติดตั้งและเริ่มใช้งาน

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ที่ root ของโปรเจกต์:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=bababook_db
JWT_SECRET=supersecretkeybababook2026
```

> เปลี่ยน `DB_PASSWORD` ให้ตรงกับรหัสผ่าน MySQL ของคุณ

### 3. เริ่ม MySQL (XAMPP)

เปิด XAMPP Control Panel แล้วกด **Start** ที่ MySQL

### 4. สร้างฐานข้อมูล

```bash
mysql -u root -p < database/init.sql
```

คำสั่งนี้จะสร้างตารางทั้งหมดและใส่ข้อมูลตัวอย่างให้พร้อมใช้

> หรือทำผ่าน phpMyAdmin: เลือก Import → เลือกไฟล์ `database/init.sql` → Go

### 5. รัน Server

```bash
node index.js
```

Server จะเริ่มทำงานที่ `http://localhost:5000`

---

## API Endpoints

Base URL: `http://localhost:5000`  
ทุก Endpoint ขึ้นต้นด้วย `/api`

### Authentication

| Method | Endpoint | Auth | คำอธิบาย |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | สมัครสมาชิกใหม่ |
| POST | `/api/auth/login` | ❌ | เข้าสู่ระบบ (รับ Token) |

### Books

| Method | Endpoint | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/books` | ❌ | ดึงหนังสือทั้งหมด |
| GET | `/api/books/:id` | ❌ | ดึงหนังสือตาม ID |
| POST | `/api/books` | ✅ Admin | เพิ่มหนังสือใหม่ |
| PUT | `/api/books/:id` | ✅ Admin | แก้ไขหนังสือ |
| DELETE | `/api/books/:id` | ✅ Admin | ลบหนังสือ (Soft Delete) |

### Cart

| Method | Endpoint | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/cart` | ✅ User | ดึงตะกร้าสินค้า |
| POST | `/api/cart/add` | ✅ User | เพิ่มสินค้าลงตะกร้า |
| PUT | `/api/cart/items/:id` | ✅ User | เปลี่ยนจำนวนสินค้า |
| DELETE | `/api/cart/items/:id` | ✅ User | ลบสินค้าออกจากตะกร้า |

### Orders

| Method | Endpoint | Auth | คำอธิบาย |
|---|---|---|---|
| POST | `/api/orders` | ✅ User | สร้างคำสั่งซื้อ (Checkout) |
| GET | `/api/orders` | ✅ User | ดูประวัติคำสั่งซื้อของตัวเอง |
| GET | `/api/orders/:id` | ✅ User | ดูรายละเอียดคำสั่งซื้อ |
| GET | `/api/orders/admin` | ✅ Admin | ดูคำสั่งซื้อทั้งหมดในระบบ |
| PUT | `/api/orders/admin/:id/status` | ✅ Admin | เปลี่ยนสถานะคำสั่งซื้อ |

> รายละเอียด Request/Response ทั้งหมดอยู่ใน [spec/api.md](spec/api.md)

---

## ข้อมูลทดสอบ (Seed Data)

หลังจากรัน `init.sql` แล้ว จะมีข้อมูลตัวอย่างดังนี้:

**Users:**
| Email | Password | Role |
|---|---|---|
| admin@example.com | password123 | admin |
| user1@example.com | password123 | user |

**Books:** 10 เล่ม (The Weight of Ink, A Little Life, Pachinko, The Name of the Wind, The Fault in Our Stars, Gone Girl, Dune, It, The Alchemist, Norwegian Wood)

**Cart ของ user1:** มีสินค้าตัวอย่าง 2 รายการพร้อมทดสอบ  
**Order ของ user1:** มีประวัติคำสั่งซื้อ 1 รายการ (status: paid)

---

## การรีเซ็ตข้อมูลตัวอย่าง

ถ้าต้องการรีเซ็ตฐานข้อมูลกลับไปเป็นค่าเริ่มต้น ให้ import `init.sql` ใหม่:

```bash
mysql -u root -p < database/init.sql
```

> ⚠️ คำเตือน: คำสั่งนี้จะลบข้อมูลทั้งหมดแล้วสร้างใหม่

---

## การ Authenticate กับ API

1. เรียก `POST /api/auth/login` เพื่อรับ Token
2. นำ Token ไปใส่ใน Header ของ Request ที่ต้องการ Auth:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```
