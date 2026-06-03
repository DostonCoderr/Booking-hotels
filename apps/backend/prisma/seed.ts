import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  await prisma.listing.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.review.deleteMany()
  await prisma.message.deleteMany()
  await prisma.user.deleteMany()

  const password = await bcrypt.hash('password123', 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@airbnb.com',
      name: 'Admin User',
      password,
      isHost: true,
      isVerified: true
    }
  })

  const testUser = await prisma.user.create({
    data: {
      email: 'user@airbnb.com',
      name: 'Test User',
      password,
      isHost: false,
      isVerified: true
    }
  })

  const listings = [
    {
      title: 'Toshkent markazidagi chiroyli kvartira',
      description: 'Shahar markazida joylashgan, to\'liq jihozlangan 2 xonali kvartira. Metro bekatiga 5 daqiqa.',
      price: 65,
      category: 'apartment',
      type: 'entire',
      address: 'Amir Temur ko\'chasi 15',
      city: 'Toshkent',
      country: 'O\'zbekiston',
      latitude: 41.311081,
      longitude: 69.240562,
      maxGuests: 4,
      bedrooms: 2,
      beds: 2,
      bathrooms: 1,
      amenities: ['WiFi', 'Oshxona', 'Kir yuvish mashinasi', 'Konditsioner'],
      hostId: admin.id,
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800']
    },
    {
      title: 'Samarqand Registon yaqinidagi mehmon uyi',
      description: 'Registon ansamblidan 10 daqiqa piyoda. An\'anaviy o\'zbek uslubida.',
      price: 45,
      category: 'house',
      type: 'private',
      address: 'Registon ko\'chasi 22',
      city: 'Samarqand',
      country: 'O\'zbekiston',
      latitude: 39.6547,
      longitude: 66.9758,
      maxGuests: 3,
      bedrooms: 1,
      beds: 2,
      bathrooms: 1,
      amenities: ['WiFi', 'Nonushta', 'Konditsioner'],
      hostId: admin.id,
      images: ['https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800']
    },
    {
      title: 'Buxoro eski shahardagi villa',
      description: 'Buxoroning tarixiy markazida joylashgan hashamatli villa. Hovli va basseyn mavjud.',
      price: 120,
      category: 'villa',
      type: 'entire',
      address: 'Lyabi-Hauz 5',
      city: 'Buxoro',
      country: 'O\'zbekiston',
      latitude: 39.7747,
      longitude: 64.4286,
      maxGuests: 6,
      bedrooms: 3,
      beds: 4,
      bathrooms: 2,
      amenities: ['WiFi', 'Basseyn', 'Oshxona', 'Bepul parking'],
      hostId: admin.id,
      images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800']
    }
  ]

  for (const listing of listings) {
    await prisma.listing.create({ data: listing })
  }

  console.log('✅ Seed ma\'lumotlar yuklandi!')
  console.log('👤 Admin: admin@airbnb.com / password123')
  console.log('👤 User: user@airbnb.com / password123')
  console.log('🏠 3 ta listing yaratildi')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
