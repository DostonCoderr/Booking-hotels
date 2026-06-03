# 🏠 StayVerse - Airbnb Clone

<div align="center">

![StayVerse Banner]()

**Zamonaviy turar joy bron qilish platformasi**

[![GitHub license](https://img.shields.io/github/license/DostonCoderr/Booking-hotels)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/DostonCoderr/Booking-hotels)](https://github.com/DostonCoderr/Booking-hotels/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/DostonCoderr/Booking-hotels)](https://github.com/DostonCoderr/Booking-hotels/issues)
[![Render](https://img.shields.io/badge/Deployed%20on-Render-blue)](https://render.com)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-black)](https://expo.dev)

</div>

## 📱 Loyiha haqida

StayVerse - bu foydalanuvchilarga butun dunyo bo'ylab turar joylarni topish, bron qilish va boshqarish imkoniyatini beruvchi zamonaviy platforma. Hostlar o'z joylarini ro'yxatga olish, bronlarni boshqarish va daromadlarini kuzatish imkoniyatiga ega.

### ✨ Asosiy xususiyatlar

- 🔐 **Autentifikatsiya** - Email/Password va Clerk orqali ijtimoiy tarmoqlar (Google, Apple, Facebook)
- 🏠 **Listinglar** - Turar joylarni qo'shish, tahrirlash va o'chirish
- 📅 **Bron qilish** - To'lov tizimi bilan integratsiyalashgan bron qilish
- 💬 **Xabarlar** - Real-time xabar almashish
- ⭐ **Sharhlar** - Foydalanuvchilar va hostlar o'rtasida reyting tizimi
- 🔔 **Bildirishnomalar** - Telegram bot orqali real-time bildirishnomalar
- 📊 **Admin panel** - Listinglarni tasdiqlash va boshqarish

## 🏗️ Texnologiyalar

### Backend
| Texnologiya | Tavsif |
|-------------|--------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web framework |
| **TypeScript** | Type-safe development |
| **PostgreSQL** | Asosiy ma'lumotlar bazasi |
| **Redis** | Cache va session management |
| **Prisma** | Database ORM |
| **JWT** | Authentication |
| **Stripe** | To'lov tizimi |
| **Cloudinary** | Rasm yuklash |
| **Telegram Bot API** | Bildirishnomalar |

### Frontend (Mobile)
| Texnologiya | Tavsif |
|-------------|--------|
| **React Native** | Mobile framework |
| **Expo** | Development platform |
| **Clerk** | Authentication |
| **Zustand** | State management |
| **TanStack Query** | Data fetching |
| **React Navigation** | Routing |
| **Expo Router** | File-based routing |

### Cloud xizmatlar
| Xizmat | Provider |
|--------|----------|
| **Database** | Neon PostgreSQL |
| **Cache** | Upstash Redis |
| **Images** | Cloudinary |
| **Payments** | Stripe |
| **Auth (Social)** | Clerk |
| **Hosting** | Render |

## 📁 Loyiha tuzilishi
Booking-hotels/
├── apps/
│ ├── backend/ # Backend API
│ │ ├── src/ # Source code
│ │ ├── prisma/ # Database schema
│ │ └── package.json
│ └── mobile/ # React Native app
│ ├── app/ # Expo Router pages
│ ├── components/ # Reusable components
│ ├── services/ # API services
│ ├── stores/ # Zustand stores
│ └── package.json
├── .gitignore
└── README.md



## 🚀 Tez boshlash

### Talablar

- Node.js 18+
- npm yoki yarn
- PostgreSQL (local yoki Neon cloud)
- Redis (local yoki Upstash cloud)
- Expo CLI (mobile uchun)

### Backend ni sozlash


# Backend papkasiga o'tish
cd apps/backend

# Paketlarni o'rnatish
npm install

# Environment faylni sozlash
cp .env.example .env
# .env faylini o'z ma'lumotlaringiz bilan to'ldiring

# Prisma client generate
npx prisma generate

# Database migratsiyasi
npx prisma migrate dev

# Backendni ishga tushirish
npm run dev



Mobile app ni sozlash



# Mobile papkasiga o'tish
cd apps/mobile

# Paketlarni o'rnatish
npm install

# Environment faylni sozlash
echo "EXPO_PUBLIC_API_URL=http://localhost:3000/api" > .env

# Expo ni ishga tushirish
npx expo start




Docker bilan (alternativ)
# Docker Compose orqali
docker-compose up -d

# Yoki alohida containerlar
docker run -d --name airbnb-postgres -e POSTGRES_PASSWORD=airbnb123 -p 5434:5432 postgres:15
docker run -d --name airbnb-redis -p 6381:6379 redis:alpine






📄 API Dokumentatsiyasi
Endpoint	Method	Tavsif
/api/auth/register	POST	Ro'yxatdan o'tish
/api/auth/login	POST	Kirish
/api/users/profile	GET	Profilni olish
/api/listings	GET	Listinglarni olish
/api/listings	POST	Listing qo'shish
/api/bookings	POST	Bron qilish
/api/reviews	POST	Sharh qoldirish
/api/messages	GET	Xabarlarni olish




🔒 Maxfiylik siyosati
1. To'planadigan ma'lumotlar

    Shaxsiy ma'lumotlar: Ism, email, telefon raqam

    Foydalanish ma'lumotlari: IP manzil, brauzer turi, qurilma ma'lumotlari

    To'lov ma'lumotlari: Stripe orqali xavfsiz qayta ishlanadi

2. Ma'lumotlardan foydalanish

    Xizmat ko'rsatish va takomillashtirish

    Xavfsizlikni ta'minlash

    Marketing va tahlil (rozilik asosida)

3. Ma'lumotlarni saqlash

    Ma'lumotlar Neon (PostgreSQL) va Upstash (Redis) cloud xizmatlarida saqlanadi

    Barcha ma'lumotlar SSL/TLS orqali uzatiladi

    Parollar bcrypt bilan xeshlanadi

4. Uchinchi tomon xizmatlari

    Stripe - To'lovlarni qayta ishlash

    Cloudinary - Rasmlarni saqlash

    Clerk - Autentifikatsiya

    Telegram - Bildirishnomalar

5. Sizning huquqlaringiz

    Ma'lumotlaringizga kirish va ularni tuzatish

    Ma'lumotlaringizni o'chirish

    Reklama roziligini bekor qilish

6. Xavfsizlik

    HTTPS/TLS orqali xavfsiz ulanish

    Rate limiting va DDoS himoyasi

    Regular security updates

📜 Litsenziya

Ushbu loyiha MIT litsenziyasi ostida tarqatiladi.
👨‍💻 Muallif

Dostonbek

    GitHub: @DostonCoderr

🤝 Hissa qo'shish

Hissa qo'shish uchun:

    Fork qiling

    Feature branch yarating (git checkout -b feature/amazing)

    Commit qiling (git commit -m 'Add amazing feature')

    Push qiling (git push origin feature/amazing)

    Pull Request yarating

📧 Aloqa

    Email: otkurovdoston69@gmail.com

    Telegram: https://t.me/DostonCoder

<div align="center">

⭐️ Star qo'yishni unutmang!

© 2024 StayVerse. Barcha huquqlar himoyalangan.
</div> 

