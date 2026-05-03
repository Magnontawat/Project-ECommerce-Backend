# BaBaBook API Specification

ไฟล์นี้สรุป API ทั้งหมดที่มีในระบบ ณ ปัจจุบัน เพื่อให้นำไปใช้เชื่อมต่อกับฝั่ง Frontend ได้อย่างถูกต้อง

---

## 1. Get All Books
ดึงข้อมูลหนังสือทั้งหมดที่มีอยู่ในฐานข้อมูล

- **URL:** `/api/books`
- **Method:** `GET`
- **Base URL (Local):** `http://localhost:5000`
- **Full Endpoint:** `http://localhost:5000/api/books`

### 📥 Request
ไม่ต้องส่ง Parameters หรือ Body ใดๆ

### 📤 Response
**Status:** `200 OK`
**Content-Type:** `application/json`

**Example Response:**
```json
[
  {
    "id": 1,
    "title": "The Weight of Ink",
    "author": "Rachel Kadish",
    "price": "24.00",
    "cover": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80",
    "category": "Historical Fiction",
    "description": "A sweeping historical narrative set in London of the 1660s and of the early twenty-first century."
  },
  {
    "id": 2,
    "title": "A Little Life",
    "author": "Hanya Yanagihara",
    "price": "22.50",
    "cover": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80",
    "category": "Contemporary Fiction",
    "description": "A novel about the lives of four college friends in New York City."
  }
]
```

### ❌ Error Response (กรณีเชื่อมต่อ DB ไม่ได้หรือเซิร์ฟเวอร์มีปัญหา)
**Status:** `500 Internal Server Error`
**Content-Type:** `application/json`

**Example:**
```json
{
  "message": "เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือจากเซิร์ฟเวอร์"
}
```

---

## 2. Get Book by ID
ดึงข้อมูลหนังสือแบบเฉพาะเจาะจง 1 เล่ม ตาม ID ที่ระบุ

- **URL:** `/api/books/:id`
- **Method:** `GET`
- **Base URL (Local):** `http://localhost:5000`
- **Full Endpoint:** `http://localhost:5000/api/books/1` (ตัวอย่าง ดึงหนังสือ ID 1)

### 📥 Request
- **URL Parameters:**
  - `id` (Number): ไอดีของหนังสือที่ต้องการดึงข้อมูล

### 📤 Response
**Status:** `200 OK`
**Content-Type:** `application/json`

**Example Response:**
```json
{
  "id": 1,
  "title": "The Weight of Ink",
  "author": "Rachel Kadish",
  "price": "24.00",
  "cover": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80",
  "category": "Historical Fiction",
  "description": "A sweeping historical narrative set in London of the 1660s and of the early twenty-first century."
}
```
*(หมายเหตุ: API ส่งค่ากลับมาเป็น Object ชุดเดียว)*

### ❌ Error Response (กรณีเชื่อมต่อ DB ไม่ได้หรือเซิร์ฟเวอร์มีปัญหา)
**Status:** `500 Internal Server Error`
**Content-Type:** `application/json`

**Example:**
```json
{
  "message": "เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือจากเซิร์ฟเวอร์"
}
```

---

## 3. Register User
สมัครสมาชิกใหม่ โดยระบบจะตั้งค่าเริ่มต้นให้เป็น Role `buyer` และ Level `1` เสมอ

- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Base URL (Local):** `http://localhost:5000`

### 📥 Request Body (JSON)
```json
{
  "email": "user@example.com",
  "username": "newuser",
  "password": "mypassword123"
}
```

### 📤 Response (201 Created)
```json
{
  "id": 3,
  "email": "user@example.com",
  "username": "newuser",
  "role": "buyer",
  "level": 1,
  "token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

### ❌ Error Response
**Status:** `400 Bad Request`
- กรณีส่งข้อมูลไม่ครบ: `{ "message": "กรุณากรอก Email, Username และ Password ให้ครบถ้วน" }`
- กรณี Email ซ้ำ: `{ "message": "Email นี้ถูกใช้งานแล้ว" }`

**Status:** `500 Internal Server Error`
- `{ "message": "เกิดข้อผิดพลาดในการสมัครสมาชิก" }`

---

## 4. Login User
เข้าสู่ระบบเพื่อรับ Token สำหรับนำไปใช้ยืนยันตัวตนในระบบ

- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Base URL (Local):** `http://localhost:5000`

### 📥 Request Body (JSON)
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

### 📤 Response (200 OK)
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "level": 99,
  "token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

### ❌ Error Response
**Status:** `400 Bad Request`
- กรณีส่งข้อมูลไม่ครบ: `{ "message": "กรุณากรอก Email และ Password ให้ครบถ้วน" }`

**Status:** `401 Unauthorized`
- กรณีรหัสผิดหรือหา Email ไม่เจอ: `{ "message": "Email หรือ Password ไม่ถูกต้อง" }`

**Status:** `500 Internal Server Error`
- `{ "message": "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" }`

---

## 5. Add to Cart
เพิ่มสินค้าลงในตระกร้า (ต้อง Login ก่อน)

- **URL:** `/api/cart/add`
- **Method:** `POST`
- **Base URL (Local):** `http://localhost:5000`
- **Authentication:** `Bearer <token>` (ต้องแนบ Token ใน Header)

### 📥 Request Body (JSON)
```json
{
  "bookId": 1,
  "quantity": 2
}
```

### 📤 Response (200 OK)
```json
{
  "message": "เพิ่มสินค้าลงตระกร้าเรียบร้อย",
  "cartId": 1,
  "bookId": 1,
  "quantity": 2
}
```

### ❌ Error Response (กรณีไม่ได้ Login หรือไม่ได้ส่ง bookId)
**Status:** `401 Unauthorized` / `400 Bad Request`
```json
{
  "message": "ไม่ได้รับอนุญาต (Unauthorized), ไม่พบ Token"
}
```

---

## 6. Add New Book (Admin)
เพิ่มหนังสือใหม่ลงในระบบ (ต้องเป็น Admin เท่านั้น)

- **URL:** `/api/books`
- **Method:** `POST`
- **Authentication:** `Bearer <token>` (ต้องเป็น Admin Token)

### 📥 Request Body (JSON)
```json
{
  "title": "New Book Title",
  "author": "Author Name",
  "price": 25.00,
  "cover": "https://example.com/image.jpg",
  "category": "Fiction",
  "description": "Book description here...",
  "stock": 100
}
```

### 📤 Response (201 Created)
```json
{
  "message": "เพิ่มหนังสือเรียบร้อยแล้ว",
  "bookId": 4
}
```

---

## 7. Update Book (Admin)
แก้ไขข้อมูลหนังสือเดิม (ต้องเป็น Admin เท่านั้น)

- **URL:** `/api/books/:id`
- **Method:** `PUT`
- **Authentication:** `Bearer <token>` (ต้องเป็น Admin Token)

### 📥 Request Body (JSON)
ส่งเฉพาะฟิลด์ที่ต้องการแก้ไข
```json
{
  "price": 29.99,
  "stock": 150
}
```

### 📤 Response (200 OK)
```json
{
  "message": "แก้ไขข้อมูลหนังสือเรียบร้อยแล้ว"
}
```

---

## 8. Delete Book (Admin)
ลบหนังสือออกจากระบบ (ต้องเป็น Admin เท่านั้น)

- **URL:** `/api/books/:id`
- **Method:** `DELETE`
- **Authentication:** `Bearer <token>` (ต้องเป็น Admin Token)

### 📤 Response (200 OK)
```json
{
  "message": "ลบหนังสือเรียบร้อยแล้ว"
}
```

---

## 💡 วิธีเรียกใช้จากหน้าบ้าน (ตัวอย่าง Code)

หากคุณใช้ `fetch` ใน React/JS:

**ดึงข้อมูลทั้งหมด:**
```javascript
const fetchBooks = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/books');
    const data = await response.json();
    console.log(data); // นำข้อมูลไปใช้ต่อ เช่น set state
  } catch (error) {
    console.error('Error fetching books:', error);
  }
};
```

**ดึงข้อมูลตาม ID:**
```javascript
const fetchBookDetail = async (id) => {
  try {
    const response = await fetch(`http://localhost:5000/api/books/${id}`);
    const data = await response.json();
    console.log(data); // นำข้อมูลไปใช้ต่อ (data เป็น object)
  } catch (error) {
    console.error('Error fetching book details:', error);
  }
};

**เพิ่มสินค้าลงตระกร้า (ต้องมี Token):**
```javascript
const addToCart = async (bookId, quantity, token) => {
  try {
    const response = await fetch('http://localhost:5000/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ bookId, quantity })
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error adding to cart:', error);
  }
};
```

```
