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
[
  {
    "id": 1,
    "title": "The Weight of Ink",
    "author": "Rachel Kadish",
    "price": "24.00",
    "cover": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80",
    "category": "Historical Fiction",
    "description": "A sweeping historical narrative set in London of the 1660s and of the early twenty-first century."
  }
]
```
*(หมายเหตุ: ปัจจุบัน API ส่งค่ากลับมาเป็น Array แม้จะมีแค่ 1 เล่ม เนื่องจากรูปแบบของ mysql2 `query`)*

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
    console.log(data[0]); // นำข้อมูลไปใช้ต่อ (data เป็น array จึงต้องเข้าถึง index 0)
  } catch (error) {
    console.error('Error fetching book details:', error);
  }
};
```
