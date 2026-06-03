// types/index.ts

export interface User {
  id: string
  name: string
  email: string
  avatar: string | null
  role: 'USER' | 'HOST' | 'ADMIN'  // role qo'shildi
  isVerified?: boolean
  phone?: string
  createdAt?: string
  isActive?: boolean
}

export interface Listing {
  id: string
  title: string
  description: string
  price: number
  category: string
  type: string
  address: string
  city: string
  country: string
  latitude: number
  longitude: number
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  images: string[]
  amenities: string[]
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectReason?: string
  isActive: boolean
  hostId: string
  host?: {
    id: string
    name: string
    avatar: string | null
    email?: string
    phone?: string
    isVerified?: boolean
  }
  avgRating: number
  reviewCount: number
  createdAt: string
}

export interface Booking {
  id: string
  checkIn: string
  checkOut: string
  guests: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  listing: {
    id: string
    title: string
    images: string[]
    address: string
    city: string
    country: string
  }
  guest?: User
  createdAt: string
}

export interface Review {
  id: string
  rating: number
  comment: string
  author: Pick<User, 'id' | 'name' | 'avatar'>
  createdAt: string
}

export interface Message {
  id: string
  content: string
  isRead: boolean
  sender: Pick<User, 'id' | 'name' | 'avatar'>
  senderId: string
  receiverId: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'booking' | 'message' | 'review' | 'payment' | 'system' | 'listing_approved' | 'listing_rejected' | 'host_request'
  data: any
  isRead: boolean
  createdAt: string
}

export interface SearchFilters {
  city?: string
  checkIn?: string
  checkOut?: string
  guests?: number
  category?: string
  minPrice?: number
  maxPrice?: number
}

// Admin va Host uchun yangi turlar
export interface AdminStats {
  users: {
    total: number
    hosts: number
    admins: number
  }
  listings: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
  bookings: {
    total: number
    recent: Booking[]
  }
  revenue: number
}

export interface HostStats {
  listings: {
    total: number
    approved: number
    pending: number
    rejected: number
  }
  bookings: {
    total: number
    recent: Booking[]
  }
  revenue: number
}