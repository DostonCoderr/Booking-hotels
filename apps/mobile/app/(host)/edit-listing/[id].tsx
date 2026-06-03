// app/(host)/edit-listing/[id].tsx

import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Image, Dimensions, Platform
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@/services/api'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const isTablet = SCREEN_WIDTH >= 768
const isSmallPhone = SCREEN_WIDTH <= 375

// Premium Dark Cyber Palette
const C = {
  bg: '#0A0D14',
  bgCard: '#10141E',
  primary: '#38BDF8',
  primaryGradient: ['#00F2FE', '#4FACFE'] as const,
  accentGradient: ['#F43F5E', '#FF2E93'] as const,
  text: '#F3F4F6',
  textLight: '#9CA3AF',
  textLighter: '#6B7280',
  border: 'rgba(255, 255, 255, 0.06)',
  inputBg: 'rgba(255, 255, 255, 0.03)',
  danger: '#FF3B30',
  dangerBg: 'rgba(255, 59, 48, 0.12)',
  success: '#34D399',
}

// Responsive helpers
const rf = (base: number) => {
  if (isTablet) return base * 1.15
  if (isSmallPhone) return base * 0.9
  return Math.round(base)
}

const rs = (base: number) => {
  if (isTablet) return base * 1.15
  if (isSmallPhone) return base * 0.9
  return Math.round(base)
}

const categories = ['apartment', 'house', 'villa', 'cabin', 'cottage', 'beach', 'unique']
const amenitiesList = ['WiFi', 'Basseyn', 'Oshxona', 'Bepul parking', 'Konditsioner', 'Kir yuvish mashinasi', 'Nonushta', 'TV', 'Lift', 'Gym', 'Balkon', 'Hovli']

export default function EditListingScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'apartment',
    type: 'entire',
    address: '',
    city: '',
    country: 'Uzbekistan',
    maxGuests: 1,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    amenities: [] as string[],
    images: [] as string[],
  })

  // Fetch listing data
  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['host-listing', id],
    queryFn: async () => {
      if (!id || id === 'undefined') {
        throw new Error('Listing ID not found')
      }
      const { data } = await api.get(`/host/listings/${id}`)
      return data
    },
    enabled: !!id && id !== 'undefined',
  })

  // Populate form
  useEffect(() => {
    if (listing) {
      setForm({
        title: listing.title || '',
        description: listing.description || '',
        price: listing.price ? listing.price.toString() : '',
        category: listing.category || 'apartment',
        type: listing.type || 'entire',
        address: listing.address || '',
        city: listing.city || '',
        country: listing.country || 'Uzbekistan',
        maxGuests: listing.maxGuests ? parseInt(listing.maxGuests) : 1,
        bedrooms: listing.bedrooms ? parseInt(listing.bedrooms) : 1,
        beds: listing.beds ? parseInt(listing.beds) : 1,
        bathrooms: listing.bathrooms ? parseFloat(listing.bathrooms) : 1,
        amenities: listing.amenities || [],
        images: listing.images || [],
      })
    }
  }, [listing])

  // Upload image
  const uploadImage = async (uri: string): Promise<string> => {
    const formData = new FormData()
    formData.append('image', {
      uri: uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any)

    const { data } = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    })
    return data.url
  }

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Ruxsat kerak', 'Rasmlarni yuklash uchun galereyaga ruxsat berishingiz lozim')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets) {
      setUploading(true)
      try {
        const uploadedUrls = []
        for (const asset of result.assets) {
          const url = await uploadImage(asset.uri)
          uploadedUrls.push(url)
        }
        setForm({ ...form, images: [...form.images, ...uploadedUrls] })
      } catch (err: any) {
        Alert.alert('Xatolik', err.response?.data?.message || 'Rasm yuklashda xatolik yuz berdi')
      } finally {
        setUploading(false)
      }
    }
  }

  const removeImage = (index: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) })
  }

  const toggleAmenity = (amenity: string) => {
    if (form.amenities.includes(amenity)) {
      setForm({ ...form, amenities: form.amenities.filter(a => a !== amenity) })
    } else {
      setForm({ ...form, amenities: [...form.amenities, amenity] })
    }
  }

  // Counter helpers for specification inputs
  const updateCount = (key: 'maxGuests' | 'bedrooms' | 'bathrooms', type: 'inc' | 'dec') => {
    setForm(prev => {
      const current = prev[key]
      const step = key === 'bathrooms' ? 0.5 : 1
      let newVal = type === 'inc' ? current + step : current - step
      if (newVal < (key === 'bathrooms' ? 0 : 1)) newVal = key === 'bathrooms' ? 0 : 1
      return { ...prev, [key]: newVal }
    })
  }

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`/host/listings/${id}`, {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        type: form.type,
        address: form.address,
        city: form.city,
        country: form.country,
        maxGuests: form.maxGuests,
        bedrooms: form.bedrooms,
        beds: form.maxGuests, // sync beds with max guests or keep formula
        bathrooms: form.bathrooms,
        amenities: form.amenities,
        images: form.images,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-listings'] })
      queryClient.invalidateQueries({ queryKey: ['host-listing', id] })
      Alert.alert(
        'Muvaffaqiyatli!',
        'E\'lon muvaffaqiyatli tahrirlandi. Moderator tekshiruvidan so\'ng yangilanishlar aks etadi.',
        [{ text: 'OK', onPress: () => router.back() }]
      )
    },
    onError: (err: any) => {
      Alert.alert('Xatolik', err.response?.data?.message || 'Tahrirlash jarayonida xatolik yuz berdi')
    },
  })

  const handleSubmit = () => {
    if (!form.title || !form.description || !form.price || !form.address) {
      Alert.alert('Xatolik', 'Iltimos, barcha majburiy (*) maydonlarni to\'ldiring')
      return
    }
    updateMutation.mutate()
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={rf(48)} color={C.danger} />
        <Text style={styles.errorText}>E\'lon ma\'lumotlarini yuklab bo\'lmadi</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBackBtn}>
          <Text style={styles.backBtnText}>Orqaga qaytish</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={rf(22)} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.title}>E'lonni tahrirlash</Text>
        <View style={{ width: rs(38) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          
          {/* Images Section */}
          <Text style={styles.label}>
            Rasmlar ({form.images.length}/10)
            {uploading && <Text style={{ color: C.primary }}> (Yuklanmoqda...)</Text>}
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
            {form.images.map((img, i) => (
              <View key={i} style={styles.imageContainer}>
                <Image source={{ uri: img }} style={styles.image} />
                <TouchableOpacity style={styles.removeImage} onPress={() => removeImage(i)} activeOpacity={0.8}>
                  <Ionicons name="close-circle" size={rf(20)} color={C.danger} />
                </TouchableOpacity>
              </View>
            ))}
            {form.images.length < 10 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImages} disabled={uploading} activeOpacity={0.7}>
                {uploading ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={rf(28)} color={C.textLight} />
                    <Text style={styles.addImageText}>Rasm qo'shish</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Title */}
          <Text style={styles.label}>Sarlavha *</Text>
          <TextInput
            style={styles.input}
            placeholder="Masalan: Premium shinam kvartira"
            placeholderTextColor={C.textLighter}
            value={form.title}
            onChangeText={(text) => setForm({ ...form, title: text })}
          />

          {/* Description */}
          <Text style={styles.label}>Tavsif *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Kvartira/Uy haqida batafsil ma'lumot kiriting..."
            placeholderTextColor={C.textLighter}
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
          />

          {/* Price */}
          <Text style={styles.label}>Narx (USD / kecha) *</Text>
          <TextInput
            style={styles.input}
            placeholder="50"
            placeholderTextColor={C.textLighter}
            keyboardType="numeric"
            value={form.price}
            onChangeText={(text) => setForm({ ...form, price: text })}
          />

          {/* Category */}
          <Text style={styles.label}>Kategoriya</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categories.map((cat) => {
              const isActive = form.category === cat
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryBtn, isActive && styles.categoryActive]}
                  onPress={() => setForm({ ...form, category: cat })}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {/* Address */}
          <Text style={styles.label}>Manzil *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ko'cha nomi, uy raqami"
            placeholderTextColor={C.textLighter}
            value={form.address}
            onChangeText={(text) => setForm({ ...form, address: text })}
          />
          
          {/* City & Country */}
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Shahar"
              placeholderTextColor={C.textLighter}
              value={form.city}
              onChangeText={(text) => setForm({ ...form, city: text })}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Davlat"
              placeholderTextColor={C.textLighter}
              value={form.country}
              onChangeText={(text) => setForm({ ...form, country: text })}
            />
          </View>

          {/* Amenities */}
          <Text style={styles.label}>Qulayliklar</Text>
          <View style={styles.amenitiesGrid}>
            {amenitiesList.map((amenity) => {
              const isSelected = form.amenities.includes(amenity)
              return (
                <TouchableOpacity
                  key={amenity}
                  style={[styles.amenityBtn, isSelected && styles.amenityActive]}
                  onPress={() => toggleAmenity(amenity)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={isSelected ? 'checkmark-circle' : 'add-circle-outline'} 
                    size={rf(16)} 
                    color={isSelected ? C.primary : C.textLight} 
                  />
                  <Text style={[styles.amenityText, isSelected && styles.amenityTextActive]}>{amenity}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Smart Spec Counters (Xususiyatlar) */}
          <Text style={styles.label}>Xususiyatlar</Text>
          <View style={styles.counterCard}>
            {/* Max Guests */}
            <View style={styles.counterRow}>
              <View>
                <Text style={styles.counterTitle}>Maksimal mehmonlar</Text>
                <Text style={styles.counterSub}>Joy sig'imi</Text>
              </View>
              <View style={styles.counterActions}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => updateCount('maxGuests', 'dec')}>
                  <Ionicons name="remove" size={rf(18)} color={C.text} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{form.maxGuests}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={() => updateCount('maxGuests', 'inc')}>
                  <Ionicons name="add" size={rf(18)} color={C.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bedrooms */}
            <View style={[styles.counterRow, styles.counterBorder]}>
              <View>
                <Text style={styles.counterTitle}>Yotoqxonalar</Text>
                <Text style={styles.counterSub}>Xonalar soni</Text>
              </View>
              <View style={styles.counterActions}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => updateCount('bedrooms', 'dec')}>
                  <Ionicons name="remove" size={rf(18)} color={C.text} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{form.bedrooms}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={() => updateCount('bedrooms', 'inc')}>
                  <Ionicons name="add" size={rf(18)} color={C.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bathrooms */}
            <View style={[styles.counterRow, styles.counterBorder]}>
              <View>
                <Text style={styles.counterTitle}>Hammomlar</Text>
                <Text style={styles.counterSub}>Dush/Yuvinish xonasi</Text>
              </View>
              <View style={styles.counterActions}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => updateCount('bathrooms', 'dec')}>
                  <Ionicons name="remove" size={rf(18)} color={C.text} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{form.bathrooms}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={() => updateCount('bathrooms', 'inc')}>
                  <Ionicons name="add" size={rf(18)} color={C.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitBtn, (updateMutation.isPending || uploading) && styles.disabled]} 
          onPress={handleSubmit}
          disabled={updateMutation.isPending || uploading}
          activeOpacity={0.85}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#0A0D14" />
          ) : (
            <LinearGradient colors={C.primaryGradient} style={StyleSheet.absoluteFillObject} />
          )}
          {!updateMutation.isPending && <Text style={styles.submitText}>O'zgarishlarni saqlash</Text>}
        </TouchableOpacity>

        <View style={{ height: rs(30) }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: C.bg 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: C.bg,
    gap: rs(12) 
  },
  scrollContent: {
    paddingBottom: rs(20)
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: rs(16), 
    paddingVertical: rs(12),
    borderBottomWidth: 1,
    borderBottomColor: C.border
  },
  backBtn: { 
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: C.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border
  },
  backBtnText: { 
    color: C.primary, 
    fontSize: rf(14), 
    fontWeight: '600' 
  },
  title: { 
    fontSize: rf(18), 
    fontWeight: '700', 
    color: C.text, 
    flex: 1, 
    textAlign: 'center',
    letterSpacing: -0.3
  },
  form: { 
    paddingHorizontal: rs(16) 
  },
  label: { 
    fontSize: rf(13), 
    fontWeight: '600', 
    color: C.text, 
    marginBottom: rs(8), 
    marginTop: rs(18),
    letterSpacing: -0.1
  },
  input: { 
    backgroundColor: C.inputBg, 
    borderRadius: rs(14), 
    paddingHorizontal: rs(14), 
    paddingVertical: rs(12), 
    fontSize: rf(14), 
    color: C.text,
    borderWidth: 1, 
    borderColor: C.border, 
    marginBottom: rs(4) 
  },
  textArea: { 
    minHeight: rs(100), 
    textAlignVertical: 'top' 
  },
  row: { 
    flexDirection: 'row', 
    gap: rs(12),
    marginTop: rs(8)
  },
  
  // Image Row Styles
  imageRow: { 
    flexDirection: 'row', 
    gap: rs(10),
    paddingVertical: rs(4)
  },
  imageContainer: { 
    position: 'relative',
    marginRight: rs(2)
  },
  image: { 
    width: rs(90), 
    height: rs(90), 
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: C.border
  },
  removeImage: { 
    position: 'absolute', 
    top: rs(-6), 
    right: rs(-6), 
    backgroundColor: C.bg, 
    borderRadius: rs(10) 
  },
  addImageBtn: { 
    width: rs(90), 
    height: rs(90), 
    borderRadius: rs(14), 
    borderWidth: 1.5, 
    borderColor: C.border, 
    borderStyle: 'dashed', 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: C.inputBg,
    gap: rs(4) 
  },
  addImageText: { 
    fontSize: rf(10), 
    color: C.textLight,
    fontWeight: '500'
  },

  // Categories Styles
  categoryRow: { 
    flexDirection: 'row', 
    gap: rs(8),
    paddingVertical: rs(4)
  },
  categoryBtn: { 
    paddingHorizontal: rs(16), 
    paddingVertical: rs(8), 
    borderRadius: rs(20), 
    backgroundColor: C.bgCard, 
    borderWidth: 1, 
    borderColor: C.border 
  },
  categoryActive: { 
    backgroundColor: 'rgba(56, 189, 248, 0.1)', 
    borderColor: C.primary 
  },
  categoryText: { 
    fontSize: rf(13), 
    color: C.textLight,
    fontWeight: '500'
  },
  categoryTextActive: { 
    color: C.primary,
    fontWeight: '600'
  },

  // Amenities Styles
  amenitiesGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: rs(8), 
    marginBottom: rs(6) 
  },
  amenityBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: rs(6), 
    paddingHorizontal: rs(12), 
    paddingVertical: rs(8), 
    borderRadius: rs(20), 
    backgroundColor: C.bgCard, 
    borderWidth: 1, 
    borderColor: C.border 
  },
  amenityActive: { 
    backgroundColor: 'rgba(56, 189, 248, 0.08)', 
    borderColor: C.primary 
  },
  amenityText: { 
    fontSize: rf(12), 
    color: C.textLight,
    fontWeight: '500'
  },
  amenityTextActive: {
    color: C.text,
    fontWeight: '600'
  },

  // Counter Section Styles
  counterCard: {
    backgroundColor: C.bgCard,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: rs(16),
    marginTop: rs(4)
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rs(14),
  },
  counterBorder: {
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  counterTitle: {
    fontSize: rf(13.5),
    fontWeight: '600',
    color: C.text,
  },
  counterSub: {
    fontSize: rf(11),
    color: C.textLighter,
    marginTop: rs(2),
  },
  counterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(14),
  },
  counterBtn: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: rf(15),
    fontWeight: '700',
    color: C.text,
    minWidth: rs(20),
    textAlign: 'center',
  },

  // Submit Button
  submitBtn: { 
    marginHorizontal: rs(16), 
    height: rs(50),
    borderRadius: rs(14), 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: rs(28),
    overflow: 'hidden',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6
  },
  submitText: { 
    color: '#0A0D14', 
    fontSize: rf(15), 
    fontWeight: '700',
    letterSpacing: -0.2
  },
  disabled: { 
    opacity: 0.5 
  },
  errorText: { 
    fontSize: rf(15), 
    color: C.textLight, 
    textAlign: 'center',
    fontWeight: '500'
  },
  errorBackBtn: {
    marginTop: rs(8),
    paddingHorizontal: rs(16),
    paddingVertical: rs(8),
    borderRadius: rs(10),
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.border
  }
})