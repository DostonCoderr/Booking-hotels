import { z } from 'zod'

export const createBookingSchema = z.object({
  listingId: z.string().min(1, 'Listing ID kerak'),
  checkIn: z.string().refine(
    val => new Date(val) > new Date(),
    'Check-in sanasi kelajakda bo\'lishi kerak'
  ),
  checkOut: z.string(),
  guests: z.number().int().positive('Mehmonlar soni musbat bo\'lishi kerak')
})
