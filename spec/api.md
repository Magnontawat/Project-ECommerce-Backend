# BaBaBook API Specification

ไฟล์นี้สรุป API ทั้งหมดที่มีในระบบ ณ ปัจจุบัน เพื่อให้นำไปใช้เชื่อมต่อกับฝั่ง Frontend ได้อย่างถูกต้อง

**Base URL (Local):** `http://localhost:5000`

---

## 🔧 Backend Checklist — สิ่งที่ต้องทำ / แก้ไข

> ติ๊ก `[x]` เมื่อทำเสร็จแล้ว

### 🗄️ Database

- [x] **`book_variants.stock` รองรับ `NULL`**
  - แก้ใน `database/init.sql`: `stock INT NULL DEFAULT 0`
  - เหตุผล: ebook variant ไม่มี stock จริง — Frontend ส่ง `null` มาเสมอ

---

### 🛠️ API — แก้ไข Endpoint ที่มีอยู่แล้ว

- [x] **`POST /api/books` — ยอมรับ `stock: null` สำหรับ ebook**
  - แก้ validation ใน `bookController.js`: ข้าม stock check เมื่อ `type === "ebook"`
  - ใช้ `v.type === 'ebook' ? (v.stock ?? null) : v.stock` ตอน insert

- [x] **`PUT /api/books/:id` — ยอมรับ `stock: null` สำหรับ ebook**
  - แก้ validation เช่นเดียวกับ POST
  - Frontend ส่งเฉพาะ `title`, `author`, `genre`, `variants` (ไม่ส่ง `cover_image`)
  - variants ที่ส่งมาจะ **ลบ variants เดิมทั้งหมด** แล้วแทนด้วยชุดใหม่ (ตาม spec เดิม)

---

### 🚀 API — Endpoint ใหม่ที่สร้างเพิ่ม

- [x] **`GET /api/cart`** — ดึงรายการสินค้าในตะกร้าของ user ที่ login อยู่
  - Auth: Bearer Token (User)
  - Response: รายการ cart items พร้อมข้อมูล book + variant

- [x] **`DELETE /api/cart/items/:id`** — ลบสินค้าออกจากตะกร้า
  - Auth: Bearer Token (User)
  - `:id` คือ cart item ID (ไม่ใช่ variantId)

- [x] **`PUT /api/cart/items/:id`** — แก้ไขจำนวนสินค้าในตะกร้า
  - Auth: Bearer Token (User)
  - Body: `{ "quantity": 2 }`

- [x] **`POST /api/orders`** — สร้าง order จาก cart ปัจจุบัน
  - Auth: Bearer Token (User)
  - ล้าง cart หลัง order สำเร็จ

- [x] **`GET /api/orders`** — ดึงประวัติ order ทั้งหมดของ user
  - Auth: Bearer Token (User)

- [x] **`GET /api/orders/:id`** — ดึงรายละเอียด order ตาม ID
  - Auth: Bearer Token (User)

---

## สารบัญ

### ✅ Implemented

| # | Endpoint | Method | Auth |
|---|---|---|---|
| 1 | `/api/books` | GET | Public |
| 2 | `/api/books/:id` | GET | Public |
| 3 | `/api/auth/register` | POST | Public |
| 4 | `/api/auth/login` | POST | Public |
| 5 | `/api/cart/add` | POST | User |
| 6 | `/api/books` | POST | Admin |
| 7 | `/api/books/:id` | PUT | Admin |
| 8 | `/api/books/:id` | DELETE | Admin |
| 9 | `/api/cart` | GET | User |
| 10 | `/api/cart/items/:id` | DELETE | User |
| 11 | `/api/cart/items/:id` | PUT | User |
| 12 | `/api/orders` | POST | User |
| 13 | `/api/orders` | GET | User |
| 14 | `/api/orders/:id` | GET | User |

---

## โครงสร้าง Variant

หนังสือแต่ละเล่มมีหลาย **Variant** (ฉบับ) แยกกัน โดยแต่ละ Variant มีราคาและสต็อกเป็นของตัวเอง

| type | ความหมาย | stock |
|---|---|---|
| `th` | ฉบับภาษาไทย | ตัวเลขจริง |
| `en` | ฉบับภาษาอังกฤษ | ตัวเลขจริง |
| `ebook` | ฉบับดิจิทัล | **`null`** (ไม่จำกัด — แสดงเป็น ∞ ฝั่ง Frontend) |

> **กฎ ebook stock:**  
> - Frontend ส่ง `stock: null` เสมอสำหรับ ebook (ทั้ง POST และ PUT)  
> - Backend ต้องยอมรับ `null` ใน field `stock` ของ ebook variant  
> - DB column `stock` ต้องรองรับ `NULL` (ไม่ใช่ `NOT NULL`)  
> - Frontend แสดงผลเป็น `∞` และซ่อน stock input สำหรับ ebook

---

## 1. Get All Books ✅

ดึงข้อมูลหนังสือทั้งหมดพร้อม Variants

- **URL:** `GET /api/books`
- **Auth:** ไม่ต้องการ

> **Frontend Usage:**
> - `HomePage` — แสดงรายการหนังสือทั้งหมดสำหรับผู้ใช้ทั่วไป
> - `ManageProductsPage` (`/admin/manage-products`) — Admin ใช้ endpoint เดียวกันนี้เพื่อดึงข้อมูลสินค้าทั้งหมดมาแสดงในตารางจัดการ (Auth ไม่จำเป็นฝั่ง API แต่ route ถูก Guard ด้วย `ProtectedRoute role="admin"`)

### Request
ไม่ต้องส่ง Parameters หรือ Body ใดๆ

### Response — 200 OK

```json
[
  {
    "id": 1,
    "title": "The Weight of Ink",
    "author": "Rachel Kadish",
    "publisher": "Houghton Mifflin Harcourt",
    "publish_year": 2017,
    "genre": "historical",
    "synopsis": "A sweeping historical narrative set in London of the 1660s and of the early twenty-first century.",
    "cover_image_url": "http://localhost:5000/uploads/covers/cover_1715000000000.jpg",
    "created_at": "2026-01-01T00:00:00.000Z",
    "variants": [
      { "id": 1, "book_id": 1, "type": "th",    "price": "320.00", "stock": 50   },
      { "id": 2, "book_id": 1, "type": "en",    "price": "450.00", "stock": 30   },
      { "id": 3, "book_id": 1, "type": "ebook", "price": "149.00", "stock": null }
    ]
  }
]
```

> `cover_image_url` อาจเป็น `null` ถ้าหนังสือยังไม่มีรูปปก  
> `variants` เรียงลำดับ: `th` → `en` → `ebook` เสมอ

### Error — 500
```json
{ "message": "เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือ" }
```

---

## 2. Get Book by ID ✅

ดึงข้อมูลหนังสือ 1 เล่มตาม ID พร้อม Variants

- **URL:** `GET /api/books/:id`
- **Auth:** ไม่ต้องการ

### Request
- **URL Parameter:** `id` (number) — ID ของหนังสือ

### Response — 200 OK

```json
{
  "id": 1,
  "title": "The Weight of Ink",
  "author": "Rachel Kadish",
  "publisher": "Houghton Mifflin Harcourt",
  "publish_year": 2017,
  "genre": "historical",
  "synopsis": "A sweeping historical narrative set in London of the 1660s and of the early twenty-first century.",
  "cover_image_url": "http://localhost:5000/uploads/covers/cover_1715000000000.jpg",
  "created_at": "2026-01-01T00:00:00.000Z",
  "variants": [
    { "id": 1, "book_id": 1, "type": "th",    "price": "320.00", "stock": 50   },
    { "id": 2, "book_id": 1, "type": "en",    "price": "450.00", "stock": 30   },
    { "id": 3, "book_id": 1, "type": "ebook", "price": "149.00", "stock": null }
  ]
}
```

### Error — 404
```json
{ "message": "ไม่พบหนังสือที่ต้องการ" }
```

### Error — 500
```json
{ "message": "เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือ" }
```

---

## 3. Register User ✅

สมัครสมาชิกใหม่ ระบบจะตั้งค่าเริ่มต้นเป็น role `user` และ level `1` เสมอ

- **URL:** `POST /api/auth/register`
- **Auth:** ไม่ต้องการ
- **Content-Type:** `application/json`

### Request Body

```json
{
  "email": "user@example.com",
  "username": "newuser",
  "password": "mypassword123"
}
```

### Response — 201 Created

```json
{
  "id": 3,
  "email": "user@example.com",
  "username": "newuser",
  "role": "user",
  "level": 1,
  "token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

### Error Responses

| Status | กรณี | Message |
|---|---|---|
| `400` | ส่งข้อมูลไม่ครบ | `"กรุณากรอกข้อมูลให้ครบถ้วน"` |
| `409` | Email ซ้ำ | `"อีเมลนี้ถูกใช้งานแล้ว"` |
| `409` | Username ซ้ำ | `"ชื่อผู้ใช้นี้ถูกใช้งานแล้ว"` |
| `500` | Server Error | `"เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"` |

---

## 4. Login User ✅

เข้าสู่ระบบเพื่อรับ Token สำหรับยืนยันตัวตน

- **URL:** `POST /api/auth/login`
- **Auth:** ไม่ต้องการ
- **Content-Type:** `application/json`

### Request Body

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

### Response — 200 OK

```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "level": 99,
  "token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

> `role` มีค่าเป็น `"user"` หรือ `"admin"` เท่านั้น  
> Token มีอายุ **30 วัน** — ให้ Frontend เก็บไว้ใน localStorage หรือ cookie

### Error Responses

| Status | กรณี | Message |
|---|---|---|
| `400` | ส่งข้อมูลไม่ครบ | `"กรุณากรอกอีเมลและรหัสผ่าน"` |
| `404` | ไม่พบ Email ในระบบ | `"ไม่พบบัญชีผู้ใช้นี้"` |
| `401` | Password ไม่ถูกต้อง | `"อีเมลหรือรหัสผ่านไม่ถูกต้อง"` |
| `500` | Server Error | `"เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"` |

---

## 5. Add to Cart ✅

เพิ่ม Variant ของหนังสือลงในตะกร้า (ต้อง Login ก่อน)

- **URL:** `POST /api/cart/add`
- **Auth:** `Bearer <token>`
- **Content-Type:** `application/json`

> **สำคัญ:** ส่ง `variantId` (ID ของ `book_variants`) ไม่ใช่ `bookId`  
> ดู `variantId` ได้จาก response ของ GET /api/books

### Request Body

```json
{
  "variantId": 2,
  "quantity": 1
}
```

| Field | Type | Required | หมายเหตุ |
|---|---|---|---|
| `variantId` | number | ✅ | ID ของ variant ที่ต้องการซื้อ |
| `quantity` | number | ❌ | จำนวน (default = 1) |

### Response — 200 OK (เพิ่มสินค้าใหม่)

```json
{
  "message": "เพิ่มสินค้าลงตะกร้าเรียบร้อย",
  "cartId": 1,
  "variantId": 2,
  "quantity": 1
}
```

### Response — 200 OK (Variant นั้นอยู่ในตะกร้าอยู่แล้ว → บวกจำนวน)

```json
{
  "message": "อัปเดตจำนวนสินค้าในตะกร้าเรียบร้อย",
  "cartId": 1,
  "variantId": 2,
  "quantity": 3
}
```

> `quantity` ที่ส่งกลับมาคือจำนวนรวมทั้งหมดในตะกร้า (ไม่ใช่จำนวนที่เพิ่งเพิ่ม)

### Error Responses

| Status | กรณี | Message |
|---|---|---|
| `400` | ไม่ส่ง `variantId` | `"กรุณาระบุ variantId"` |
| `401` | ไม่มี Token / Token ไม่ถูกต้อง | `"ไม่ได้รับอนุญาต"` |
| `500` | Server Error | `"เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตะกร้า"` |

---

## 6. Add New Book (Admin) ✅

เพิ่มหนังสือใหม่พร้อม Variants ลงในระบบ (ต้องเป็น Admin เท่านั้น)

- **URL:** `POST /api/books`
- **Auth:** `Bearer <token>` (Admin Token)
- **Content-Type:** `multipart/form-data` (เพราะรองรับการอัพโหลดรูปภาพ)

### Request Fields (multipart/form-data)

| Field | Type | Required | หมายเหตุ |
|---|---|---|---|
| `title` | string | ✅ | ชื่อหนังสือ |
| `author` | string | ✅ | ชื่อผู้แต่ง |
| `genre` | string | ✅ | ประเภทหนังสือ (ดูค่าที่รองรับด้านล่าง) |
| `publisher` | string | ❌ | ชื่อสำนักพิมพ์ |
| `publish_year` | number | ❌ | ปีที่พิมพ์ เช่น `2023` |
| `synopsis` | string | ❌ | เรื่องย่อ |
| `variants` | string (JSON) | ✅ | Array ของ Variants เข้ารหัสเป็น JSON string |
| `cover_image` | file | ❌ | รูปปก (jpg / png / webp, ขนาดสูงสุด 5 MB) |

**ค่า `genre` ที่รองรับ:**
`fantasy`, `romance`, `thriller`, `mystery`, `horror`, `sci-fi`, `historical`, `adventure`, `drama`, `comedy`, `young-adult`, `literary`, `action`, `BL`, `GL`, `other`

**รูปแบบ `variants` (JSON string):**
```json
[
  { "type": "th",    "price": 320, "stock": 50  },
  { "type": "en",    "price": 450, "stock": 30  },
  { "type": "ebook", "price": 149, "stock": 999 }
]
```
> ต้องมี variants อย่างน้อย 1 รายการ, `type` ต้องไม่ซ้ำกันในหนังสือเล่มเดียวกัน

### Response — 201 Created

```json
{
  "message": "เพิ่มหนังสือสำเร็จ",
  "book": {
    "id": 4,
    "title": "New Book Title",
    "author": "Author Name",
    "publisher": "Publisher Name",
    "publish_year": 2024,
    "genre": "fantasy",
    "synopsis": "Book synopsis here...",
    "cover_image_url": "http://localhost:5000/uploads/covers/cover_1715000000000.jpg",
    "created_at": "2026-01-01T00:00:00.000Z",
    "variants": [
      { "id": 10, "book_id": 4, "type": "th",    "price": "320.00", "stock": 50   },
      { "id": 11, "book_id": 4, "type": "en",    "price": "450.00", "stock": 30   },
      { "id": 12, "book_id": 4, "type": "ebook", "price": "149.00", "stock": null }
    ]
  }
}
```

### Error Responses

| Status | กรณี | Message |
|---|---|---|
| `400` | ส่ง `title`, `author`, หรือ `genre` ไม่ครบ | `"กรุณากรอกข้อมูลที่จำเป็นให้ครบ (title, author, genre)"` |
| `400` | `variants` ไม่ใช่ JSON ที่ถูกต้อง | `"รูปแบบ variants ไม่ถูกต้อง กรุณาส่งเป็น JSON Array string"` |
| `400` | `variants` ว่างเปล่า | `"กรุณาระบุ variants อย่างน้อย 1 รายการ"` |
| `400` | `type` ไม่ถูกต้อง | `"ประเภท variant ไม่ถูกต้อง: \"xxx\""` |
| `400` | `type` ซ้ำกัน | `"ประเภท variant ซ้ำกัน: \"th\""` |
| `400` | ไม่มี `price` หรือ `stock` | `"variant \"th\" ต้องมี price และ stock"` |
| `401` | ไม่มี Token / Token ไม่ถูกต้อง | `"ไม่ได้รับอนุญาต"` |
| `403` | ไม่ใช่ Admin | `"ไม่มีสิทธิ์เข้าถึง"` |
| `500` | Server Error | `"เกิดข้อผิดพลาดในการเพิ่มหนังสือ"` |

---

## 7. Update Book (Admin) ✅

แก้ไขข้อมูลหนังสือ (Partial Update — ส่งเฉพาะ field ที่ต้องการแก้ไข)

- **URL:** `PUT /api/books/:id`
- **Auth:** `Bearer <token>` (Admin Token)
- **Content-Type:** `multipart/form-data`

> **Frontend Usage:**  
> `ManageProductsPage` ใช้ endpoint นี้สำหรับ **Inline Edit** — ส่งเฉพาะ `title`, `author`, `genre`, และ `variants` (ไม่ส่ง `cover_image`, `publisher`, `publish_year`, `synopsis`)

### Request Fields (multipart/form-data)

ส่งเฉพาะ field ที่ต้องการแก้ไข — field ที่ไม่ได้ส่งจะใช้ค่าเดิม

| Field | Type | หมายเหตุ |
|---|---|---|
| `title` | string | ชื่อหนังสือ |
| `author` | string | ชื่อผู้แต่ง |
| `genre` | string | ประเภทหนังสือ |
| `publisher` | string | ชื่อสำนักพิมพ์ |
| `publish_year` | number | ปีที่พิมพ์ |
| `synopsis` | string | เรื่องย่อ |
| `variants` | string (JSON) | ถ้าส่งมา จะ **ลบ Variants เดิมทั้งหมด** แล้วแทนด้วยชุดใหม่ |
| `cover_image` | file | ถ้าส่งมา จะแทนที่รูปเดิม |

### ตัวอย่าง Request จาก ManageProductsPage (Inline Edit)

```javascript
const formData = new FormData()
formData.append('title',  'ชื่อหนังสือที่แก้แล้ว')
formData.append('author', 'ชื่อผู้แต่ง')
formData.append('genre',  'fantasy')
formData.append('variants', JSON.stringify([
  { type: 'th',    price: 320, stock: 50   },
  { type: 'en',    price: 450, stock: 30   },
  { type: 'ebook', price: 149, stock: null }  // ebook ส่ง null เสมอ — ไม่มี stock จริง
]))
// ไม่ส่ง cover_image, publisher, publish_year, synopsis ใน inline edit
```

### Response — 200 OK

```json
{
  "message": "แก้ไขข้อมูลหนังสือสำเร็จ",
  "book": {
    "id": 1,
    "title": "Updated Title",
    "author": "Rachel Kadish",
    "publisher": "Houghton Mifflin Harcourt",
    "publish_year": 2017,
    "genre": "historical",
    "synopsis": "Updated synopsis...",
    "cover_image_url": "http://localhost:5000/uploads/covers/cover_1715000000001.jpg",
    "created_at": "2026-01-01T00:00:00.000Z",
    "variants": [
      { "id": 13, "book_id": 1, "type": "th", "price": "350.00", "stock": 45   }
    ]
  }
}
```

### Error Responses

| Status | กรณี | Message |
|---|---|---|
| `404` | ไม่พบหนังสือ ID นั้น | `"ไม่พบหนังสือที่ต้องการแก้ไข"` |
| `400` | `variants` ไม่ใช่ JSON ที่ถูกต้อง | `"รูปแบบ variants ไม่ถูกต้อง"` |
| `401` | ไม่มี Token / Token ไม่ถูกต้อง | `"ไม่ได้รับอนุญาต"` |
| `403` | ไม่ใช่ Admin | `"ไม่มีสิทธิ์เข้าถึง"` |
| `500` | Server Error | `"เกิดข้อผิดพลาดในการแก้ไขข้อมูลหนังสือ"` |

---

## 8. Delete Book (Admin) ✅

ลบหนังสือและ Variants ทั้งหมดออกจากระบบ

- **URL:** `DELETE /api/books/:id`
- **Auth:** `Bearer <token>` (Admin Token)

> **Frontend UX:**  
> `ManageProductsPage` มี confirm dialog 2 ขั้นตอนก่อนลบจริง (กด "ลบ" → ขึ้น "ยืนยันลบหนังสือเล่มนี้?" → กด "ยืนยันลบ" → ถึงจะเรียก API)

### Request
- **URL Parameter:** `id` (number) — ID ของหนังสือที่ต้องการลบ

### Response — 200 OK

```json
{ "message": "ลบหนังสือสำเร็จ" }
```

### Error Responses

| Status | กรณี | Message |
|---|---|---|
| `404` | ไม่พบหนังสือ ID นั้น | `"ไม่พบหนังสือที่ต้องการลบ"` |
| `401` | ไม่มี Token / Token ไม่ถูกต้อง | `"ไม่ได้รับอนุญาต"` |
| `403` | ไม่ใช่ Admin | `"ไม่มีสิทธิ์เข้าถึง"` |
| `500` | Server Error | `"เกิดข้อผิดพลาดในการลบหนังสือ"` |

---

## 9. Get Cart ✅

ดึงข้อมูลตะกร้าของผู้ใช้พร้อมรายละเอียดหนังสือและ Variant ครบถ้วน

- **URL:** `GET /api/cart`
- **Auth:** `Bearer <token>`

### Request
ไม่ต้องส่ง Body ใดๆ — ระบบดึงตะกร้าของ User จาก Token

### Response — 200 OK

```json
{
  "cartId": 1,
  "items": [
    {
      "cartItemId": 1,
      "quantity": 1,
      "variant": {
        "id": 4,
        "type": "th",
        "price": "280.00",
        "stock": 40
      },
      "book": {
        "id": 2,
        "title": "A Little Life",
        "author": "Hanya Yanagihara",
        "cover_image_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80"
      }
    },
    {
      "cartItemId": 2,
      "quantity": 2,
      "variant": {
        "id": 11,
        "type": "ebook",
        "price": "169.00",
        "stock": null
      },
      "book": {
        "id": 4,
        "title": "The Name of the Wind",
        "author": "Patrick Rothfuss",
        "cover_image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80"
      }
    }
  ]
}
```

> ถ้าตะกร้าว่างเปล่า หรือ User ยังไม่เคย Add to Cart เลย → `items` จะเป็น `[]`

### Error Responses

| Status | กรณี | Message |
|---|---|---|
| `401` | ไม่มี Token / Token ไม่ถูกต้อง | `"ไม่ได้รับอนุญาต"` |
| `500` | Server Error | `"เกิดข้อผิดพลาดในการดึงข้อมูลตะกร้า"` |

---

## 10. Remove Cart Item ✅

ลบรายการสินค้าออกจากตะกร้า

- **URL:** `DELETE /api/cart/items/:id`
- **Auth:** `Bearer <token>`

### Request
- **URL Parameter:** `id` (number) — `cartItemId` (ไม่ใช่ `variantId` หรือ `bookId`)  
  ดู `cartItemId` ได้จาก response ของ GET /api/cart

### Response — 200 OK

```json
{ "message": "ลบสินค้าออกจากตะกร้าเรียบร้อย" }
```

### Error Responses

| Status | กรณี | Message |
|---|---|---|
| `404` | ไม่พบ cart item ID นั้น หรือไม่ใช่ของ User นี้ | `"ไม่พบรายการสินค้าในตะกร้า"` |
| `401` | ไม่มี Token / Token ไม่ถูกต้อง | `"ไม่ได้รับอนุญาต"` |
| `500` | Server Error | `"เกิดข้อผิดพลาดในการลบสินค้าออกจากตะกร้า"` |

---

## 11. Update Cart Item Quantity ✅

แก้ไขจำนวนสินค้าในตะกร้า (ต้องการลบให้ใช้ DELETE endpoint แทน)

- **URL:** `PUT /api/cart/items/:id`
- **Auth:** `Bearer <token>`
- **Content-Type:** `application/json`

### Request
- **URL Parameter:** `id` (number) — `cartItemId`

```json
{ "quantity": 3 }
```

> `quantity` ต้องมากกว่า 0 — ถ้าต้องการลบให้ใช้ `DELETE /api/cart/items/:id`

### Response — 200 OK

```json
{
  "message": "อัปเดตจำนวนสินค้าเรียบร้อย",
  "cartItemId": 1,
  "quantity": 3
}
```

### Error Responses

| Status | กรณี | Message |
|---|---|---|
| `400` | `quantity` ไม่ถูกต้อง (≤ 0 หรือไม่ได้ส่งมา) | `"กรุณาระบุจำนวนที่ถูกต้อง"` |
| `404` | ไม่พบ cart item หรือไม่ใช่ของ User นี้ | `"ไม่พบรายการสินค้าในตะกร้า"` |
| `401` | ไม่มี Token / Token ไม่ถูกต้อง | `"ไม่ได้รับอนุญาต"` |
| `500` | Server Error | `"เกิดข้อผิดพลาดในการแก้ไขจำนวนสินค้า"` |

---

## 12. Checkout (Create Order) ✅

สร้างคำสั่งซื้อจากสินค้าในตะกร้าทั้งหมด แล้วล้างตะกร้า

- **URL:** `POST /api/orders`
- **Auth:** `Bearer <token>`

> **Flow:**  
> ดึง cart items ของ User → คำนวณ total_price → สร้าง order + order_items → ล้าง cart items

### Request
ไม่ต้องส่ง Body ใดๆ — ระบบดึง cart ของ User จาก Token

### Response — 201 Created

```json
{
  "message": "สั่งซื้อสำเร็จ",
  "order": {
    "id": 2,
    "status": "pending",
    "total_price": "617.00",
    "created_at": "2026-05-09T10:00:00.000Z",
    "items": [
      {
        "id": 3,
        "quantity": 1,
        "price_at_purchase": "280.00",
        "variant": {
          "id": 4,
          "type": "th"
        },
        "book": {
          "id": 2,
          "title": "A Little Life",
          "author": "Hanya Yanagihara",
          "cover_image_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80"
        }
      },
      {
        "id": 4,
        "quantity": 2,
        "price_at_purchase": "169.00",
        "variant": {
          "id": 11,
          "type": "ebook"
        },
        "book": {
          "id": 4,
          "title": "The Name of the Wind",
          "author": "Patrick Rothfuss",
          "cover_image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80"
        }
      }
    ]
  }
}
```

> `price_at_purchase` คือราคา snapshot ณ วันที่สั่งซื้อ — จะไม่เปลี่ยนแม้ราคา variant จะถูกแก้ไขในภายหลัง

### Error Responses

| Status | กรณี | Message |
|---|---|---|
| `400` | ตะกร้าว่าง | `"ตะกร้าของคุณว่างเปล่า"` |
| `401` | ไม่มี Token / Token ไม่ถูกต้อง | `"ไม่ได้รับอนุญาต"` |
| `500` | Server Error | `"เกิดข้อผิดพลาดในการสั่งซื้อ"` |

---

## 13. Get Order History ✅

ดึงประวัติคำสั่งซื้อทั้งหมดของผู้ใช้ (เรียงจากใหม่ไปเก่า)

- **URL:** `GET /api/orders`
- **Auth:** `Bearer <token>`

### Request
ไม่ต้องส่ง Body ใดๆ

### Response — 200 OK

```json
[
  {
    "id": 1,
    "status": "paid",
    "total_price": "737.00",
    "item_count": 2,
    "created_at": "2026-04-01T10:00:00.000Z"
  },
  {
    "id": 2,
    "status": "pending",
    "total_price": "617.00",
    "item_count": 2,
    "created_at": "2026-05-09T10:00:00.000Z"
  }
]
```

> `item_count` คือจำนวนรายการสินค้า (ไม่ใช่จำนวนชิ้น)

### Error Responses

| Status | กรณี | Message |
|---|---|---|
| `401` | ไม่มี Token / Token ไม่ถูกต้อง | `"ไม่ได้รับอนุญาต"` |
| `500` | Server Error | `"เกิดข้อผิดพลาดในการดึงประวัติคำสั่งซื้อ"` |

---

## 14. Get Order Detail ✅

ดึงรายละเอียดคำสั่งซื้อครบถ้วนตาม ID

- **URL:** `GET /api/orders/:id`
- **Auth:** `Bearer <token>`

### Request
- **URL Parameter:** `id` (number) — ID ของ order

### Response — 200 OK

```json
{
  "id": 1,
  "status": "paid",
  "total_price": "737.00",
  "created_at": "2026-04-01T10:00:00.000Z",
  "items": [
    {
      "id": 1,
      "quantity": 1,
      "price_at_purchase": "320.00",
      "variant": {
        "id": 1,
        "type": "th"
      },
      "book": {
        "id": 1,
        "title": "The Weight of Ink",
        "author": "Rachel Kadish",
        "cover_image_url": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80"
      }
    },
    {
      "id": 2,
      "quantity": 3,
      "price_at_purchase": "139.00",
      "variant": {
        "id": 8,
        "type": "ebook"
      },
      "book": {
        "id": 3,
        "title": "Pachinko",
        "author": "Min Jin Lee",
        "cover_image_url": "https://images.unsplash.com/photo-1629992101753-56d196c8aabb?w=400&q=80"
      }
    }
  ]
}
```

### Error Responses

| Status | กรณี | Message |
|---|---|---|
| `404` | ไม่พบ order หรือไม่ใช่ของ User นี้ | `"ไม่พบคำสั่งซื้อ"` |
| `401` | ไม่มี Token / Token ไม่ถูกต้อง | `"ไม่ได้รับอนุญาต"` |
| `500` | Server Error | `"เกิดข้อผิดพลาดในการดึงรายละเอียดคำสั่งซื้อ"` |

---

## วิธีแนบ Token ใน Header

```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:5000/api/cart', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## ตัวอย่าง Code (Frontend)

**ดึงหนังสือทั้งหมด:**
```javascript
const fetchBooks = async () => {
  const response = await fetch('http://localhost:5000/api/books');
  const books = await response.json();
  // books คือ array, แต่ละ book มี variants[] อยู่ด้วย
};
```

**ดึงหนังสือตาม ID:**
```javascript
const fetchBook = async (id) => {
  const response = await fetch(`http://localhost:5000/api/books/${id}`);
  if (response.status === 404) { /* หนังสือไม่มีในระบบ */ return; }
  const book = await response.json();
  // book.variants คือ array ของ variant ทั้งหมดของเล่มนี้
};
```

**Login:**
```javascript
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.token);
    // data.role === "user" หรือ "admin"
  }
};
```

**ดึงตะกร้า:**
```javascript
const fetchCart = async (token) => {
  const response = await fetch('http://localhost:5000/api/cart', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  // data.items คือ array ของสินค้าในตะกร้า พร้อม book+variant info
};
```

**Checkout:**
```javascript
const checkout = async (token) => {
  const response = await fetch('http://localhost:5000/api/orders', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  // data.order คือ order ที่เพิ่งสร้าง พร้อม items ครบถ้วน
};
```

**เพิ่มหนังสือใหม่ (Admin — multipart/form-data):**
```javascript
const addBook = async (bookData, coverFile, token) => {
  const formData = new FormData();
  formData.append('title', bookData.title);
  formData.append('author', bookData.author);
  formData.append('genre', bookData.genre);
  formData.append('variants', JSON.stringify(bookData.variants)); // ต้อง stringify
  if (coverFile) formData.append('cover_image', coverFile);

  const response = await fetch('http://localhost:5000/api/books', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    // ไม่ต้องใส่ Content-Type — browser จะจัดการ boundary ของ multipart เอง
    body: formData
  });
  const data = await response.json();
  // data.book คือข้อมูลหนังสือที่เพิ่งเพิ่ม พร้อม variants
};
```
