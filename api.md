# BaBaBook — API Specification

ไฟล์นี้เป็นเอกสาร API Specification ฉบับสมบูรณ์สำหรับ Backend ของ BaBaBook  
**Backend Agent ควรใช้ไฟล์นี้เป็นแหล่งอ้างอิงหลักในการสร้างและแก้ไข API**

- Base URL (Local): `http://localhost:5000`
- Prefix ทุก Endpoint: `/api`
- Format: `application/json` ยกเว้นที่ระบุว่าใช้ `multipart/form-data`
- Authentication: `Bearer Token` ส่งผ่าน Header `Authorization: Bearer <token>`

---

## สารบัญ

| #   | Endpoint             | Method | Auth     | คำอธิบาย          |
| --- | -------------------- | ------ | -------- | ----------------- |
| 1   | `/api/auth/register` | POST   | ❌       | สมัครสมาชิก       |
| 2   | `/api/auth/login`    | POST   | ❌       | เข้าสู่ระบบ       |
| 3   | `/api/books`         | GET    | ❌       | ดึงหนังสือทั้งหมด |
| 4   | `/api/books/:id`     | GET    | ❌       | ดึงหนังสือตาม ID  |
| 5   | `/api/books`         | POST   | ✅ Admin | เพิ่มหนังสือใหม่  |

---

## 1. Register (สมัครสมาชิก)

- **URL:** `POST /api/auth/register`
- **Auth:** ไม่ต้องการ

### 📥 Request Body (`application/json`)

```json
{
  "email": "user@example.com",
  "username": "bookworm99",
  "password": "SecurePass123"
}
```

| Field      | Type   | Required | คำอธิบาย                        |
| ---------- | ------ | -------- | ------------------------------- |
| `email`    | string | ✅       | อีเมล (ต้อง unique)             |
| `username` | string | ✅       | ชื่อผู้ใช้ (ต้อง unique)        |
| `password` | string | ✅       | รหัสผ่าน (ควร hash ด้วย bcrypt) |

### 📤 Response `201 Created`

```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "bookworm99",
  "role": "user",
  "level": 1,
  "token": "<JWT_TOKEN>"
}
```

### ❌ Error Responses

| Status | เงื่อนไข                | `message` ตัวอย่าง                 |
| ------ | ----------------------- | ---------------------------------- |
| `400`  | ข้อมูลไม่ครบ            | `"กรุณากรอกข้อมูลให้ครบถ้วน"`      |
| `409`  | email หรือ username ซ้ำ | `"อีเมลนี้ถูกใช้งานแล้ว"`          |
| `500`  | เซิร์ฟเวอร์มีปัญหา      | `"เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"` |

---

## 2. Login (เข้าสู่ระบบ)

- **URL:** `POST /api/auth/login`
- **Auth:** ไม่ต้องการ

### 📥 Request Body (`application/json`)

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

| Field      | Type   | Required | คำอธิบาย |
| ---------- | ------ | -------- | -------- |
| `email`    | string | ✅       | อีเมล    |
| `password` | string | ✅       | รหัสผ่าน |

### 📤 Response `200 OK`

```json
{
  "id": 1,
  "username": "bookworm99",
  "role": "user",
  "level": 1,
  "token": "<JWT_TOKEN>"
}
```

> **หมายเหตุ:** `role` มีค่าได้ 2 แบบคือ `"user"` หรือ `"admin"`  
> Frontend ใช้ `role` นี้ในการแสดง/ซ่อน UI เช่น เมนู Add Product ใน Navbar

### ❌ Error Responses

| Status | เงื่อนไข           | `message` ตัวอย่าง                 |
| ------ | ------------------ | ---------------------------------- |
| `400`  | ข้อมูลไม่ครบ       | `"กรุณากรอกอีเมลและรหัสผ่าน"`      |
| `401`  | รหัสผ่านไม่ถูกต้อง | `"อีเมลหรือรหัสผ่านไม่ถูกต้อง"`    |
| `404`  | ไม่พบ email นี้    | `"ไม่พบบัญชีผู้ใช้นี้"`            |
| `500`  | เซิร์ฟเวอร์มีปัญหา | `"เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"` |

---

## 3. Get All Books (ดึงหนังสือทั้งหมด)

- **URL:** `GET /api/books`
- **Auth:** ไม่ต้องการ

### 📥 Request

ไม่ต้องส่ง Parameters หรือ Body ใดๆ

### 📤 Response `200 OK`

```json
[
  {
    "id": 1,
    "title": "The Weight of Ink",
    "author": "Rachel Kadish",
    "publisher": "Houghton Mifflin Harcourt",
    "publish_year": 2017,
    "genre": "historical",
    "synopsis": "A sweeping historical narrative set in London of the 1660s.",
    "cover_image_url": "https://example.com/covers/the-weight-of-ink.jpg",
    "variants": [
      { "id": 1, "book_id": 1, "type": "th", "price": "320.00", "stock": 50 },
      {
        "id": 2,
        "book_id": 1,
        "type": "ebook",
        "price": "149.00",
        "stock": 999
      }
    ]
  }
]
```

### ❌ Error Responses

| Status | เงื่อนไข             | `message` ตัวอย่าง                      |
| ------ | -------------------- | --------------------------------------- |
| `500`  | DB หรือ Server error | `"เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือ"` |

---

## 4. Get Book by ID (ดึงหนังสือตาม ID)

- **URL:** `GET /api/books/:id`
- **Auth:** ไม่ต้องการ

### 📥 Request

| Parameter  | Type   | Required | คำอธิบาย      |
| ---------- | ------ | -------- | ------------- |
| `id` (URL) | number | ✅       | ID ของหนังสือ |

### 📤 Response `200 OK`

```json
{
  "id": 1,
  "title": "The Weight of Ink",
  "author": "Rachel Kadish",
  "publisher": "Houghton Mifflin Harcourt",
  "publish_year": 2017,
  "genre": "historical",
  "synopsis": "A sweeping historical narrative set in London of the 1660s.",
  "cover_image_url": "https://example.com/covers/the-weight-of-ink.jpg",
  "variants": [
    { "id": 1, "book_id": 1, "type": "th", "price": "320.00", "stock": 50 },
    { "id": 2, "book_id": 1, "type": "ebook", "price": "149.00", "stock": 999 }
  ]
}
```

### ❌ Error Responses

| Status | เงื่อนไข             | `message` ตัวอย่าง                      |
| ------ | -------------------- | --------------------------------------- |
| `404`  | ไม่พบหนังสือ         | `"ไม่พบหนังสือที่ต้องการ"`              |
| `500`  | DB หรือ Server error | `"เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือ"` |

---

## 5. Create Book — Admin Only (เพิ่มหนังสือใหม่)

- **URL:** `POST /api/books`
- **Auth:** ✅ ต้องการ `Bearer Token` และ `role === "admin"`
- **Content-Type:** `multipart/form-data` (เพื่อรองรับไฟล์รูปภาพ)

### 📥 Request (multipart/form-data)

| Field          | Type        | Required | คำอธิบาย                                     |
| -------------- | ----------- | -------- | -------------------------------------------- |
| `title`        | string      | ✅       | ชื่อหนังสือ                                  |
| `author`       | string      | ✅       | ชื่อผู้แต่ง                                  |
| `publisher`    | string      | ❌       | ชื่อสำนักพิมพ์                               |
| `publish_year` | number      | ❌       | ปีที่พิมพ์ (เช่น `2023`)                     |
| `genre`        | string      | ✅       | แนวนิยาย (ดูค่าที่รองรับด้านล่าง)            |
| `synopsis`     | string      | ❌       | เรื่องย่อของหนังสือ                          |
| `variants`     | JSON string | ✅       | รายการ Variant (stringify array ก่อน append) |
| `cover_image`  | file        | ❌       | ไฟล์รูปภาพปก (jpg, png, webp, ≤5MB)          |

#### ค่าที่รองรับสำหรับ `genre`

| ค่า           | ความหมาย              |
| ------------- | --------------------- |
| `fantasy`     | แฟนตาซี               |
| `romance`     | โรแมนติก              |
| `thriller`    | ระทึกขวัญ             |
| `mystery`     | สืบสวนสอบสวน          |
| `horror`      | สยองขวัญ              |
| `sci-fi`      | นิยายวิทยาศาสตร์      |
| `historical`  | นิยายอิงประวัติศาสตร์ |
| `adventure`   | ผจญภัย                |
| `drama`       | ดราม่า                |
| `comedy`      | ตลกขบขัน              |
| `young-adult` | วัยรุ่น               |
| `literary`    | นิยายวรรณกรรม         |
| `action`      | แอ็คชั่น              |
| `BL`          | นิยายชายรักชาย        |
| `GL`          | นิยายหญิงรักหญิง      |
| `other`       | อื่นๆ                 |

#### โครงสร้างของ `variants` (JSON Array String)

```json
[
  { "type": "th", "price": 320, "stock": 50 },
  { "type": "en", "price": 450, "stock": 30 },
  { "type": "ebook", "price": 149, "stock": 999 }
]
```

| Field   | Type                          | Required | คำอธิบาย          |
| ------- | ----------------------------- | -------- | ----------------- |
| `type`  | `"th"` \| `"en"` \| `"ebook"` | ✅       | ประเภทของหนังสือ  |
| `price` | number                        | ✅       | ราคา (หน่วย: บาท) |
| `stock` | number                        | ✅       | จำนวนคงเหลือ      |

> **หมายเหตุ:** `type` ต้องไม่ซ้ำกันภายใน 1 หนังสือ และต้องมีอย่างน้อย 1 variant

#### ตัวอย่างการส่งจาก Frontend (วิธีที่ใช้จริงในโปรเจกต์)

Frontend ใช้ `createBook()` จาก `src/services/bookService.js`  
โดย Authorization header ถูกแนบอัตโนมัติผ่าน Axios interceptor ใน `src/services/api.js`

```javascript
// src/pages/AddProductPage.jsx
const data = new FormData()
data.append("title", form.title)
data.append("author", form.author)
data.append("publisher", form.publisher)
data.append("publish_year", form.publishYear)  // state key ชื่อ publishYear แต่ส่งเป็น publish_year
data.append("genre", form.genre)
data.append("synopsis", form.synopsis)
data.append("variants", JSON.stringify(variants))  // แปลง array → JSON string ก่อน append
if (coverFile) data.append("cover_image", coverFile)  // File object จาก <input type="file">

await createBook(data)  // createBook ใน bookService.js จัดการ header และ token ให้อัตโนมัติ
```

```javascript
// src/services/bookService.js — createBook implementation
export async function createBook(formData) {
  const response = await api.post('/books', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // Authorization: Bearer <token> ถูกแนบโดย interceptor ใน api.js อัตโนมัติ
  })
  return response.data
}
```

### 📤 Response `201 Created`

```json
{
  "message": "เพิ่มหนังสือสำเร็จ",
  "book": {
    "id": 10,
    "title": "The Name of the Wind",
    "author": "Patrick Rothfuss",
    "publisher": "DAW Books",
    "publish_year": 2007,
    "genre": "fantasy",
    "synopsis": "เรื่องราวของ Kvothe นักเวทย์ผู้เป็นตำนาน...",
    "cover_image_url": "https://example.com/covers/the-name-of-the-wind.jpg",
    "variants": [
      {
        "id": 20,
        "book_id": 10,
        "type": "th",
        "price": "350.00",
        "stock": 100
      },
      {
        "id": 21,
        "book_id": 10,
        "type": "ebook",
        "price": "199.00",
        "stock": 999
      }
    ]
  }
}
```

### ❌ Error Responses

| Status | เงื่อนไข                           | `message` ตัวอย่าง                  |
| ------ | ---------------------------------- | ----------------------------------- |
| `400`  | ข้อมูลไม่ครบ / variants ไม่ถูกต้อง | `"กรุณากรอกข้อมูลที่จำเป็นให้ครบ"`  |
| `401`  | ไม่มี Token หรือ Token หมดอายุ     | `"กรุณาเข้าสู่ระบบก่อน"`            |
| `403`  | Role ไม่ใช่ admin                  | `"คุณไม่มีสิทธิ์ดำเนินการนี้"`      |
| `409`  | ชื่อหนังสือซ้ำกัน (ถ้า implement)  | `"หนังสือชื่อนี้มีอยู่ในระบบแล้ว"`  |
| `500`  | Server / DB error                  | `"เกิดข้อผิดพลาดในการเพิ่มหนังสือ"` |

---

## 🗄️ โครงสร้างฐานข้อมูลที่แนะนำ

### ตาราง `books`

| Column            | Type                  | Notes                      |
| ----------------- | --------------------- | -------------------------- |
| `id`              | INT PK AUTO_INCREMENT |                            |
| `title`           | VARCHAR(255)          | NOT NULL                   |
| `author`          | VARCHAR(255)          | NOT NULL                   |
| `publisher`       | VARCHAR(255)          | NULLABLE                   |
| `publish_year`    | INT                   | NULLABLE                   |
| `genre`           | VARCHAR(50)           | NOT NULL                   |
| `synopsis`        | TEXT                  | NULLABLE                   |
| `cover_image_url` | TEXT                  | URL ของรูปปกที่อัปโหลดแล้ว |
| `created_at`      | DATETIME              | DEFAULT NOW()              |

### ตาราง `book_variants`

| Column    | Type                    | Notes               |
| --------- | ----------------------- | ------------------- |
| `id`      | INT PK AUTO_INCREMENT   |                     |
| `book_id` | INT FK → `books.id`     | ON DELETE CASCADE   |
| `type`    | ENUM('th','en','ebook') | NOT NULL            |
| `price`   | DECIMAL(10,2)           | NOT NULL            |
| `stock`   | INT                     | NOT NULL, DEFAULT 0 |

---

## 🔐 JWT Middleware

Backend ต้องมี middleware ตรวจสอบ Token สำหรับ route ที่ต้องการ Auth  
Frontend ส่ง Token ผ่าน Header ในรูปแบบนี้เสมอ:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Middleware ควรแนบข้อมูล user ไว้ใน `req.user` และตรวจสอบ `req.user.role === 'admin'` ก่อนอนุญาต

---

## 📁 การจัดการไฟล์รูปภาพ (Cover Image)

Backend ควรใช้ **Multer** รับไฟล์จาก `multipart/form-data` และเลือก storage strategy ดังนี้:

| Option            | คำอธิบาย                                                                        |
| ----------------- | ------------------------------------------------------------------------------- |
| **Local storage** | บันทึกใน `/uploads/covers/` แล้วส่ง URL กลับเช่น `/uploads/covers/filename.jpg` |
| **Cloud storage** | อัปโหลดไปยัง S3 / Cloudinary แล้วส่ง URL เต็มกลับ                               |

Frontend ต้องการเพียง `cover_image_url` (string URL) เพื่อแสดงรูปในหน้าเว็บ

---

## 📋 Frontend Field Mapping

ตารางนี้สรุป field ที่ Frontend ใช้จริงสำหรับแต่ละ component เพื่อให้ Backend ส่งข้อมูลได้ถูกต้อง

### `GET /api/books` และ `GET /api/books/:id` — Fields ที่ Frontend ใช้

| Frontend Component | Field ที่ใช้ | ตรงกับ API field |
|---|---|---|
| `BookCard.jsx` | `book.cover_image_url` | `cover_image_url` ✅ |
| `BookCard.jsx` | `book.variants[0].price` | `variants[].price` ✅ |
| `BookDetailPage.jsx` | `book.cover_image_url` | `cover_image_url` ✅ |
| `BookDetailPage.jsx` | `book.genre` | `genre` ✅ |
| `BookDetailPage.jsx` | `book.synopsis` | `synopsis` ✅ |
| `BookDetailPage.jsx` | `book.variants[0].price` | `variants[].price` ✅ |

> **หมายเหตุ:** BookDetailPage ยังไม่มี UI เลือก variant — แสดงราคาจาก `variants[0]` เป็น default

---

## 📅 Changelog

| วันที่ | รายการ |
|---|---|
| 2026-05-07 | สร้างไฟล์ spec เวอร์ชันแรก |
| 2026-05-07 | ตรวจสอบ spec กับ code จริง — พบและแก้ไข: `BookCard` และ `BookDetailPage` ใช้ field ผิด (`cover`, `category`, `description`, `price` flat) แก้เป็น `cover_image_url`, `genre`, `synopsis`, `variants[].price` |
| 2026-05-07 | อัปเดต JS example ใน Create Book ให้ตรงกับ code จริง (ใช้ `createBook()` + Axios interceptor แทน raw `fetch`) |
