import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Test user yaratish (agar mavjud bo'lmasa)
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'test@example.com',
      password: '$2a$12$...', // password: 123456
      isHost: true,
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
  })

  console.log(`✅ User created: ${user.email}`)

  // Listinglar yaratish
  const listings = [
    {
      title: 'Toshkent markazidagi zamonaviy kvartira',
      description: 'Shahar markazida, metroga yaqin, zamonaviy jihozlangan kvartira. Wi-Fi, konditsioner, toʻliq oshxona mavjud.',
      price: 85,
      category: 'apartment',
      type: 'entire',
      address: 'Amir Temur shoh ko\'chasi, 15',
      city: 'Toshkent',
      country: 'Oʻzbekiston',
      latitude: 41.2995,
      longitude: 69.2401,
      maxGuests: 4,
      bedrooms: 2,
      beds: 3,
      bathrooms: 1.5,
      images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=800',
        'https://images.unsplash.com/photo-1560184897-ae75f4184e6a?w=800',
      ],
      amenities: ['wifi', 'kitchen', 'ac', 'heating', 'washer', 'tv'],
      hostId: user.id,
      isActive: true,
    },
    {
      title: 'Samarqanddagi anʼanaviy uy',
      description: 'Samarqandning qadimiy qismida, Registon maydoniga yaqin, anʼanaviy uslubdagi uy. Milliy taomlar tayyorlash imkoniyati.',
      price: 120,
      category: 'house',
      type: 'entire',
      address: 'Registon ko\'chasi, 7',
      city: 'Samarqand',
      country: 'Oʻzbekiston',
      latitude: 39.6542,
      longitude: 66.9757,
      maxGuests: 6,
      bedrooms: 3,
      beds: 4,
      bathrooms: 2,
      images: [
        'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
      ],
      amenities: ['wifi', 'kitchen', 'parking', 'tv', 'workspace'],
      hostId: user.id,
      isActive: true,
    },
    {
      title: 'Buxorodagi tarixiy hovli',
      description: 'Buxoroning eski shahrida, Lyabi-Xauzga yaqin, restavratsiya qilingan tarixiy hovli. Oʻzbek mehmonxonchiligini his eting.',
      price: 95,
      category: 'villa',
      type: 'entire',
      address: 'Lyabi-Xauz, 3',
      city: 'Buxoro',
      country: 'Oʻzbekiston',
      latitude: 39.7742,
      longitude: 64.4286,
      maxGuests: 5,
      bedrooms: 2,
      beds: 3,
      bathrooms: 1.5,
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      ],
      amenities: ['wifi', 'kitchen', 'heating', 'tv'],
      hostId: user.id,
      isActive: true,
    },
    {
      title: 'Chimyon togʻlaridagi dacha',
      description: 'Toshkentdan 40 km uzoqlikda, togʻ etagidagi dam olish uyi. Toza havo, goʻzal manzara.',
      price: 150,
      category: 'cabin',
      type: 'entire',
      address: 'Chimyon massivi',
      city: 'Toshkent viloyati',
      country: 'Oʻzbekiston',
      latitude: 41.5701,
      longitude: 70.0193,
      maxGuests: 8,
      bedrooms: 4,
      beds: 6,
      bathrooms: 2,
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      ],
      amenities: ['wifi', 'kitchen', 'parking', 'heating', 'workspace'],
      hostId: user.id,
      isActive: true,
    },
  ]

  for (const listing of listings) {
    const created = await prisma.listing.create({
      data: listing,
    })
    console.log(`✅ Listing created: ${created.title}`)
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })