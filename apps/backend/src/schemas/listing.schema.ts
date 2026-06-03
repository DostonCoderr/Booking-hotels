import { z } from 'zod'

export const createListingSchema = z.object({
  title: z.string().min(5, 'Sarlavha kamida 5 ta belgi').max(100),
  description: z.string().min(20, 'Tavsif kamida 20 ta belgi').max(2000),
  price: z.number().positive('Narx musbat bo\'lishi kerak'),
  category: z.enum(['apartment', 'house', 'villa', 'cabin', 'cottage', 'beach', 'unique']),
  type: z.enum(['entire', 'private', 'shared']),
  address: z.string().min(5),
  city: z.string().min(2),
  country: z.string().min(2),
  latitude: z.number(),
  longitude: z.number(),
  maxGuests: z.number().int().positive().max(16),
  bedrooms: z.number().int().positive(),
  beds: z.number().int().positive(),
  bathrooms: z.number().positive(),
  amenities: z.string()
})
