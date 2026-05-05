# BaBaBook — API Specification

ไฟล์นี้เป็นเอกสาร API Specification ฉบับสมบูรณ์สำหรับ Backend ของ BaBaBook  
**Backend Agent ควรใช้ไฟล์นี้เป็นแหล่งอ้างอิงหลักในการสร้างและแก้ไข API**

- Base URL (Local): `http://localhost:5000`
- Prefix ทุก Endpoint: `/api`
- Format: `application/json` ยกเว้นที่ระบุว่าใช้ `multipart/form-data`
- Authentication: `Bearer Token` ส่งผ่าน Header `Authorization: Bearer <token>`

---

## สารบัญ

| #   | Endpoint             | Method   | Auth     | คำอธิบาย              |
| --- | -------------------- | -------- | -------- | --------------------- |
| 1   | `/api/auth/register` | POST     | ❌       | สมัครสมาชิก           |
| 2   | `/api/auth/login`    | POST     | ❌       | เข้าสู่ระบบ           |
| 3   | `/api/books`         | GET      | ❌       | ดึงหนังสือทั้งหมด     |
| 4   | `/api/books/:id`     | GET      | ❌       | ดึงหนังสือตาม ID      |
| 5   | `/api/books`         | POST     | ✅ Admin | เพิ่มหนังสือใหม่      |
| 6   | `/api/books/:id`     | PUT      | ✅ Admin | แก้ไขข้อมูลหนังสือ    |
| 7   | `/api/books/:id`     | DELETE   | ✅ Admin | ลบหนังสือ             |

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
    "cover_image_url": "http://localhost:5000/uploads/covers/cover-1234567890.jpg",
    "created_at": "2025-01-01T00:00:00.000Z",
    "variants": [
      { "id": 1, "book_id": 1, "type": "th",    "price": "320.00", "stock": 50  },
      { "id": 2, "book_id": 1, "type": "en",    "price": "450.00", "stock": 30  },
      { "id": 3, "book_id": 1, "type": "ebook", "price": "149.00", "stock": 999 }
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
  "cover_image_url": "http://localhost:5000/uploads/covers/cover-1234567890.jpg",
  "created_at": "2025-01-01T00:00:00.000Z",
  "variants": [
    { "id": 1, "book_id": 1, "type": "th",    "price": "320.00", "stock": 50  },
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
  { "type": "th",    "price": 320, "stock": 50  },
  { "type": "en",    "price": 450, "stock": 30  },
  { "type": "ebook", "price": 149, "stock": 999 }
]
```

| Field   | Type                          | Required | คำอธิบาย          |
| ------- | ----------------------------- | -------- | ----------------- |
| `type`  | `"th"` \| `"en"` \| `"ebook"` | ✅       | ประเภทของหนังสือ  |
| `price` | number                        | ✅       | ราคา (หน่วย: บาท) |
| `stock` | number                        | ✅       | จำนวนคงเหลือ      |

> **หมายเหตุ:** `type` ต้องไม่ซ้ำกันภายใน 1 หนังสือ และต้องมีอย่างน้อย 1 variant

#### ตัวอย่างการส่งจาก Frontend (JavaScript)

```javascript
const data = new FormData();
data.append("title", "The Name of the Wind");
data.append("author", "Patrick Rothfuss");
data.append("publisher", "DAW Books");
data.append("publish_year", 2007);
data.append("genre", "fantasy");
data.append("synopsis", "เรื่องราวของ Kvothe นักเวทย์ผู้เป็นตำนาน...");
data.append(
  "variants",
  JSON.stringify([
    { type: "th",    price: 350, stock: 100 },
    { type: "ebook", price: 199, stock: 999 },
  ]),
);
data.append("cover_image", file); // File object จาก <input type="file">

const response = await fetch("http://localhost:5000/api/books", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    // ไม่ต้องใส่ Content-Type เอง — browser จะ set multipart boundary ให้อัตโนมัติ
  },
  body: data,
});
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
    "cover_image_url": "http://localhost:5000/uploads/covers/cover-1234567890.jpg",
    "created_at": "2025-05-05T09:00:00.000Z",
    "variants": [
      { "id": 20, "book_id": 10, "type": "th",    "price": "350.00", "stock": 100 },
      { "id": 21, "book_id": 10, "type": "ebook", "price": "199.00", "stock": 999 }
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
| `500`  | Server / DB error                  | `"เกิดข้อผิดพลาดในการเพิ่มหนังสือ"` |

---

## 6. Update Book — Admin Only (แก้ไขข้อมูลหนังสือ)

- **URL:** `PUT /api/books/:id`
- **Auth:** ✅ ต้องการ `Bearer Token` และ `role === "admin"`
- **Content-Type:** `multipart/form-data`

### 📥 Request

| Parameter  | Type   | Required | คำอธิบาย      |
| ---------- | ------ | -------- | ------------- |
| `id` (URL) | number | ✅       | ID ของหนังสือ |

Body fields เหมือนกับ **Create Book (#5)** ทุกประการ แต่ทุก field เป็น **Optional**  
(ส่งเฉพาะ field ที่ต้องการแก้ไข — field ที่ไม่ส่งจะใช้ค่าเดิม)

> **หมายเหตุสำหรับ `variants`:** ถ้าส่ง `variants` มา ระบบจะ **แทนที่ variants ทั้งหมด** ของหนังสือนั้น

#### ตัวอย่างการส่งจาก Frontend (JavaScript)

```javascript
const data = new FormData();
data.append("synopsis", "เรื่องย่อที่แก้ไขใหม่...");
data.append(
  "variants",
  JSON.stringify([
    { type: "th",    price: 399, stock: 80 },
    { type: "ebook", price: 179, stock: 999 },
  ]),
);
// ถ้าต้องการเปลี่ยนรูปปกด้วย:
// data.append("cover_image", newFile);

const response = await fetch(`http://localhost:5000/api/books/${bookId}`, {
  method: "PUT",
  headers: { Authorization: `Bearer ${token}` },
  body: data,
});
```

### 📤 Response `200 OK`

```json
{
  "message": "แก้ไขข้อมูลหนังสือสำเร็จ",
  "book": {
    "id": 10,
    "title": "The Name of the Wind",
    "author": "Patrick Rothfuss",
    "publisher": "DAW Books",
    "publish_year": 2007,
    "genre": "fantasy",
    "synopsis": "เรื่องย่อที่แก้ไขใหม่...",
    "cover_image_url": "http://localhost:5000/uploads/covers/cover-1234567890.jpg",
    "created_at": "2025-05-05T09:00:00.000Z",
    "variants": [
      { "id": 30, "book_id": 10, "type": "th",    "price": "399.00", "stock": 80  },
      { "id": 31, "book_id": 10, "type": "ebook", "price": "179.00", "stock": 999 }
    ]
  }
}
```

### ❌ Error Responses

| Status | เงื่อนไข                       | `message` ตัวอย่าง                    |
| ------ | ------------------------------ | ------------------------------------- |
| `400`  | variants format ไม่ถูกต้อง     | `"รูปแบบ variants ไม่ถูกต้อง"`        |
| `401`  | ไม่มี Token หรือ Token หมดอายุ | `"กรุณาเข้าสู่ระบบก่อน"`              |
| `403`  | Role ไม่ใช่ admin              | `"คุณไม่มีสิทธิ์ดำเนินการนี้"`        |
| `404`  | ไม่พบหนังสือ                   | `"ไม่พบหนังสือที่ต้องการแก้ไข"`       |
| `500`  | Server / DB error              | `"เกิดข้อผิดพลาดในการแก้ไขข้อมูลหนังสือ"` |

---

## 7. Delete Book — Admin Only (ลบหนังสือ)

- **URL:** `DELETE /api/books/:id`
- **Auth:** ✅ ต้องการ `Bearer Token` และ `role === "admin"`

### 📥 Request

| Parameter  | Type   | Required | คำอธิบาย      |
| ---------- | ------ | -------- | ------------- |
| `id` (URL) | number | ✅       | ID ของหนังสือ |

ไม่ต้องส่ง Body

### 📤 Response `200 OK`

```json
{
  "message": "ลบหนังสือสำเร็จ"
}
```

> **หมายเหตุ:** `book_variants` ของหนังสือนั้นจะถูกลบโดยอัตโนมัติ (ON DELETE CASCADE)

### ❌ Error Responses

| Status | เงื่อนไข                       | `message` ตัวอย่าง              |
| ------ | ------------------------------ | -------------------------------- |
| `401`  | ไม่มี Token หรือ Token หมดอายุ | `"กรุณาเข้าสู่ระบบก่อน"`        |
| `403`  | Role ไม่ใช่ admin              | `"คุณไม่มีสิทธิ์ดำเนินการนี้"`  |
| `404`  | ไม่พบหนังสือ                   | `"ไม่พบหนังสือที่ต้องการลบ"`    |
| `500`  | Server / DB error              | `"เกิดข้อผิดพลาดในการลบหนังสือ"` |

---

## 🗄️ โครงสร้างฐานข้อมูล

### ตาราง `books`

| Column            | Type                                                                             | Notes                                  |
| ----------------- | -------------------------------------------------------------------------------- | -------------------------------------- |
| `id`              | INT PK AUTO_INCREMENT                                                            |                                        |
| `title`           | VARCHAR(255)                                                                     | NOT NULL                               |
| `author`          | VARCHAR(255)                                                                     | NOT NULL                               |
| `publisher`       | VARCHAR(255)                                                                     | NULLABLE                               |
| `publish_year`    | INT                                                                              | NULLABLE                               |
| `genre`           | ENUM('fantasy','romance','thriller','mystery','horror','sci-fi','historical','adventure','drama','comedy','young-adult','literary','action','BL','GL','other') | NOT NULL DEFAULT 'other' |
| `synopsis`        | TEXT                                                                             | NULLABLE                               |
| `cover_image_url` | TEXT                                                                             | URL จาก `/uploads/covers/`             |
| `created_at`      | TIMESTAMP                                                                        | DEFAULT CURRENT_TIMESTAMP              |

### ตาราง `book_variants`

| Column    | Type                    | Notes                          |
| --------- | ----------------------- | ------------------------------ |
| `id`      | INT PK AUTO_INCREMENT   |                                |
| `book_id` | INT FK → `books.id`     | ON DELETE CASCADE              |
| `type`    | ENUM('th','en','ebook') | NOT NULL                       |
| `price`   | DECIMAL(10,2)           | NOT NULL                       |
| `stock`   | INT                     | NOT NULL, DEFAULT 0            |
|           | UNIQUE(book_id, type)   | ห้ามมี type ซ้ำใน book เดียวกัน |

### ตาราง `users`

| Column     | Type                  | Notes                     |
| ---------- | --------------------- | ------------------------- |
| `id`       | INT PK AUTO_INCREMENT |                           |
| `username` | VARCHAR(255)          | UNIQUE NOT NULL           |
| `email`    | VARCHAR(255)          | UNIQUE NOT NULL           |
| `password` | VARCHAR(255)          | bcrypt hash               |
| `role`     | ENUM('user','admin')  | DEFAULT 'user'            |
| `level`    | INT                   | DEFAULT 1                 |
| `created_at` | TIMESTAMP           | DEFAULT CURRENT_TIMESTAMP |

### ตาราง `carts`

| Column     | Type                  | Notes                            |
| ---------- | --------------------- | -------------------------------- |
| `id`       | INT PK AUTO_INCREMENT |                                  |
| `user_id`  | INT FK → `users.id`   | UNIQUE, ON DELETE CASCADE        |
| `created_at` | TIMESTAMP           | DEFAULT CURRENT_TIMESTAMP        |

### ตาราง `cart_items`

| Column       | Type                        | Notes                        |
| ------------ | --------------------------- | ---------------------------- |
| `id`         | INT PK AUTO_INCREMENT       |                              |
| `cart_id`    | INT FK → `carts.id`         | ON DELETE CASCADE            |
| `variant_id` | INT FK → `book_variants.id` | ON DELETE CASCADE            |
| `quantity`   | INT                         | NOT NULL, DEFAULT 1          |
| `created_at` | TIMESTAMP                   | DEFAULT CURRENT_TIMESTAMP    |

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

Backend ใช้ **Multer** รับไฟล์จาก `multipart/form-data` field ชื่อ `cover_image`

| Option     | คำอธิบาย                                                                        |
| ---------- | ------------------------------------------------------------------------------- |
| **Local**  | บันทึกใน `/uploads/covers/` แล้วส่ง URL กลับ เช่น `http://localhost:5000/uploads/covers/filename.jpg` |
| **Cloud**  | อัปโหลดไปยัง S3 / Cloudinary แล้วส่ง URL เต็มกลับ                               |

- ขนาดไฟล์สูงสุด: **5 MB**
- นามสกุลที่รองรับ: `.jpg`, `.jpeg`, `.png`, `.webp`
- Frontend ต้องการเพียง `cover_image_url` (string URL) เพื่อแสดงรูปในหน้าเว็บ
