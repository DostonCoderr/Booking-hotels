// app/(host)/add-listing.tsx

import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Image, Dimensions, 
  Platform, Modal
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@/services/api'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'

const { width, height } = Dimensions.get('window')
const isSmallPhone = width <= 375

// Premium Dark Cyber Palette
const C = {
  bg: '#0A0D14',
  card: 'rgba(16, 20, 30, 0.65)',
  inputBg: 'rgba(255, 255, 255, 0.03)',
  primary: '#38BDF8',
  primaryGradient: ['#00F2FE', '#4FACFE'] as const,
  primaryGlow: 'rgba(56, 189, 248, 0.15)',
  text: '#F3F4F6',
  textLight: '#9CA3AF',
  textMuted: '#4B5563',
  border: 'rgba(255, 255, 255, 0.06)',
  borderActive: 'rgba(56, 189, 248, 0.4)',
  danger: '#FF3B30',
  dangerBg: 'rgba(255, 59, 48, 0.12)',
  success: '#34D399',
}

const categories = ['apartment', 'house', 'villa', 'cabin', 'cottage', 'beach', 'unique']
const amenitiesList = ['WiFi', 'Basseyn', 'Oshxona', 'Bepul parking', 'Konditsioner', 'Kir yuvish mashinasi', 'Nonushta', 'TV', 'Lift', 'Gym', 'Balkon', 'Hovli']

// Location interface
interface LocationData {
  latitude: number
  longitude: number
  address: string
  city: string
  country: string
}

export default function AddListingScreen() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const mapRef = useRef<MapView>(null)
  
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [mapVisible, setMapVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [selectedLocation, setSelectedLocation] = useState<LocationData>({
    latitude: 41.2995,
    longitude: 69.2401,
    address: '',
    city: '',
    country: 'Uzbekistan',
  })
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'apartment',
    type: 'entire',
    address: '',
    city: '',
    country: 'Uzbekistan',
    maxGuests: '1',
    bedrooms: '1',
    beds: '1',
    bathrooms: '1',
    amenities: [] as string[],
    images: [] as string[],
    latitude: '41.2995',
    longitude: '69.2401',
  })

  // Request location permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Ruxsat kerak', 'Joylashuvni belgilash uchun ruxsat bering')
      }
    })()
  }, [])

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      
      const { latitude, longitude } = location.coords
      
      // Reverse geocoding to get address
      const reverseGeo = await Location.reverseGeocodeAsync({ latitude, longitude })
      
      if (reverseGeo[0]) {
        const address = [
          reverseGeo[0].street,
          reverseGeo[0].district,
          reverseGeo[0].city,
          reverseGeo[0].region,
        ].filter(Boolean).join(', ')
        
        setSelectedLocation({
          latitude,
          longitude,
          address: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          city: reverseGeo[0].city || reverseGeo[0].region || '',
          country: reverseGeo[0].country || 'Uzbekistan',
        })
      } else {
        setSelectedLocation({
          latitude,
          longitude,
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          city: '',
          country: 'Uzbekistan',
        })
      }
      
      // Animate map to user location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        })
      }
    } catch (error) {
      Alert.alert('Xatolik', 'Joylashuvni aniqlab bo\'lmadi')
    }
  }

  // Handle map press to select location
  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate
    setSelectedLocation(prev => ({ ...prev, latitude, longitude }))
    
    // Reverse geocode on marker drag end
    updateAddressFromCoords(latitude, longitude)
  }

  // Update address from coordinates
  const updateAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      const reverseGeo = await Location.reverseGeocodeAsync({ latitude, longitude })
      
      if (reverseGeo[0]) {
        const address = [
          reverseGeo[0].street,
          reverseGeo[0].district,
          reverseGeo[0].city,
          reverseGeo[0].region,
        ].filter(Boolean).join(', ')
        
        setSelectedLocation(prev => ({
          ...prev,
          address: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          city: reverseGeo[0].city || reverseGeo[0].region || prev.city,
          country: reverseGeo[0].country || 'Uzbekistan',
        }))
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
  }

  // Search location by query
  const searchLocation = async () => {
    if (!searchQuery.trim()) return
    
    try {
      const results = await Location.geocodeAsync(searchQuery)
      if (results && results.length > 0) {
        const { latitude, longitude } = results[0]
        
        setSelectedLocation(prev => ({
          ...prev,
          latitude,
          longitude,
        }))
        
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          })
        }
        
        await updateAddressFromCoords(latitude, longitude)
      } else {
        Alert.alert('Topilmadi', 'Bu manzil topilmadi')
      }
    } catch (error) {
      Alert.alert('Xatolik', 'Qidirishda xatolik yuz berdi')
    }
  }

  // Save location from map
  const saveLocation = () => {
    setForm(prev => ({
      ...prev,
      address: selectedLocation.address,
      city: selectedLocation.city,
      country: selectedLocation.country,
      latitude: selectedLocation.latitude.toString(),
      longitude: selectedLocation.longitude.toString(),
    }))
    setMapVisible(false)
    Alert.alert('Muvaffaqiyatli', 'Joylashuv saqlandi')
  }

  // Upload single image with retry
  const uploadImage = async (uri: string, retryCount = 0): Promise<string> => {
    try {
      const formData = new FormData()
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg'
      const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg'
      
      formData.append('image', {
        uri: uri,
        type: mimeType,
        name: `photo_${Date.now()}.${fileExt}`,
      } as any)

      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      })
      
      return data.url
    } catch (error: any) {
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return uploadImage(uri, retryCount + 1)
      }
      throw new Error(error.response?.data?.message || 'Rasm yuklashda xatolik')
    }
  }

  // Pick and upload multiple images
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Ruxsat kerak', 'Rasmlarni yuklash uchun ruxsat kerak')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets) {
      setUploading(true)
      setUploadProgress(0)
      
      const totalImages = result.assets.length
      const uploadedUrls: string[] = []
      
      try {
        for (let i = 0; i < totalImages; i++) {
          const asset = result.assets[i]
          setUploadProgress(Math.round((i / totalImages) * 100))
          const url = await uploadImage(asset.uri)
          uploadedUrls.push(url)
          setUploadProgress(Math.round(((i + 1) / totalImages) * 100))
        }
        
        setForm({ ...form, images: [...form.images, ...uploadedUrls] })
        Alert.alert('Muvaffaqiyatli', `${uploadedUrls.length} ta rasm yuklandi`)
      } catch (error: any) {
        Alert.alert('Xatolik', error.message || 'Rasm yuklashda xatolik')
      } finally {
        setUploading(false)
        setUploadProgress(0)
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

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/host/listings', {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        type: form.type,
        address: form.address,
        city: form.city,
        country: form.country,
        maxGuests: parseInt(form.maxGuests),
        bedrooms: parseInt(form.bedrooms),
        beds: parseInt(form.beds),
        bathrooms: parseFloat(form.bathrooms),
        amenities: form.amenities,
        images: form.images,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-listings'] })
      queryClient.invalidateQueries({ queryKey: ['host-stats'] })
      Alert.alert(
        'Yuborildi!',
        'E\'lon tekshirish uchun yuborildi. Admin tasdiqlagandan so\'ng e\'lon qilinadi.',
        [{ text: 'OK', onPress: () => router.back() }]
      )
    },
    onError: (error: any) => {
      Alert.alert('Xatolik', error.response?.data?.message || 'E\'lon yuborishda xatolik')
    },
  })

  const handleSubmit = () => {
    if (!form.title || !form.description || !form.price || !form.address) {
      Alert.alert('Xatolik', 'Iltimos, barcha majburiy maydonlarni to\'ldiring')
      return
    }
    if (form.images.length === 0) {
      Alert.alert('Xatolik', 'Kamida 1 ta rasm yuklang')
      return
    }
    mutation.mutate()
  }

  return (
    <>
      <ScrollView style={[styles.container, { paddingTop: insets.top || 12 }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Yangi e'lon yaratish</Text>
        </View>

        <View style={styles.form}>
          {/* Media Upload Section */}
          <Text style={styles.label}>
            Rasmlar <Text style={styles.required}>*</Text> <Text style={styles.counterText}>({form.images.length}/10)</Text>
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow} contentContainerStyle={{ gap: 12 }}>
            {form.images.map((img, i) => (
              <View key={i} style={styles.imageContainer}>
                <Image source={{ uri: img }} style={styles.image} />
                <TouchableOpacity style={styles.removeImage} onPress={() => removeImage(i)} activeOpacity={0.8}>
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            
            {form.images.length < 10 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImages} disabled={uploading} activeOpacity={0.75}>
                {uploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="small" color={C.primary} />
                    <Text style={styles.uploadingText}>{uploadProgress}%</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={28} color={C.textLight} />
                    <Text style={styles.addImageText}>Qo'shish</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Form Fields */}
          <Text style={styles.label}>Sarlavha <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Masalan: Markazdagi shinam kvartira"
            placeholderTextColor={C.textMuted}
            value={form.title}
            onChangeText={(text) => setForm({ ...form, title: text })}
          />

          <Text style={styles.label}>Tavsif <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Turar joy, qulayliklar va joylashuv haqida batafsil ma'lumot bering..."
            placeholderTextColor={C.textMuted}
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
          />

          <Text style={styles.label}>Narx (USD / kecha) <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="50"
            placeholderTextColor={C.textMuted}
            keyboardType="numeric"
            value={form.price}
            onChangeText={(text) => setForm({ ...form, price: text })}
          />

          {/* Categories */}
          <Text style={styles.label}>Kategoriya</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
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

          {/* Location Section with Map Button */}
          <Text style={styles.label}>Manzil <Text style={styles.required}>*</Text></Text>
          
          <TouchableOpacity 
            style={styles.locationBtn} 
            onPress={() => setMapVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.locationBtnLeft}>
              <Ionicons name="location-outline" size={22} color={C.primary} />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Joylashuvni belgilang</Text>
                <Text style={styles.locationValue} numberOfLines={1}>
                  {form.address || 'Xaritadan belgilang'}
                </Text>
              </View>
            </View>
            <Ionicons name="map-outline" size={22} color={C.primary} />
          </TouchableOpacity>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Shahar"
              placeholderTextColor={C.textMuted}
              value={form.city}
              onChangeText={(text) => setForm({ ...form, city: text })}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Davlat"
              placeholderTextColor={C.textMuted}
              value={form.country}
              onChangeText={(text) => setForm({ ...form, country: text })}
            />
          </View>

          {/* Amenities Grid */}
          <Text style={styles.label}>Qulayliklar</Text>
          <View style={styles.amenitiesGrid}>
            {amenitiesList.map((amenity) => {
              const isSelected = form.amenities.includes(amenity)
              return (
                <TouchableOpacity
                  key={amenity}
                  style={[styles.amenityBtn, isSelected && styles.amenityActive]}
                  onPress={() => toggleAmenity(amenity)}
                  activeOpacity={0.75}
                >
                  <Ionicons 
                    name={isSelected ? 'checkmark-circle' : 'add-circle-outline'} 
                    size={17} 
                    color={isSelected ? C.primary : C.textLight} 
                  />
                  <Text style={[styles.amenityText, isSelected && styles.amenityTextActive]}>{amenity}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Specs */}
          <Text style={styles.label}>Xususiyatlar tarkibi</Text>
          <View style={styles.row}>
            <View style={styles.specInputWrapper}>
              <Text style={styles.specSubLabel}>Mehmonlar</Text>
              <TextInput
                style={[styles.input, styles.specInput]}
                placeholder="1"
                placeholderTextColor={C.textMuted}
                keyboardType="numeric"
                value={form.maxGuests}
                onChangeText={(text) => setForm({ ...form, maxGuests: text })}
              />
            </View>
            <View style={styles.specInputWrapper}>
              <Text style={styles.specSubLabel}>Yotoqxonalar</Text>
              <TextInput
                style={[styles.input, styles.specInput]}
                placeholder="1"
                placeholderTextColor={C.textMuted}
                keyboardType="numeric"
                value={form.bedrooms}
                onChangeText={(text) => setForm({ ...form, bedrooms: text })}
              />
            </View>
            <View style={styles.specInputWrapper}>
              <Text style={styles.specSubLabel}>Hammomlar</Text>
              <TextInput
                style={[styles.input, styles.specInput]}
                placeholder="1"
                placeholderTextColor={C.textMuted}
                keyboardType="numeric"
                value={form.bathrooms}
                onChangeText={(text) => setForm({ ...form, bathrooms: text })}
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={styles.submitBtnWrapper} 
          onPress={handleSubmit}
          disabled={mutation.isPending || uploading}
          activeOpacity={0.85}
        >
          <LinearGradient 
            colors={C.primaryGradient} 
            style={[styles.submitBtn, (mutation.isPending || uploading) && styles.disabled]}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#0A0D14" />
            ) : (
              <Text style={styles.submitText}>Tasdiqlashga yuborish</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Map Modal */}
      <Modal
        visible={mapVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.mapModalContainer}>
          {/* Map Header */}
          <LinearGradient colors={C.primaryGradient} style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setMapVisible(false)} style={styles.mapCloseBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.mapHeaderTitle}>Joylashuvni belgilang</Text>
            <View style={{ width: 40 }} />
          </LinearGradient>

          {/* Search Bar */}
          <View style={styles.mapSearchContainer}>
            <View style={styles.mapSearchBar}>
              <Ionicons name="search-outline" size={20} color={C.textLight} />
              <TextInput
                style={styles.mapSearchInput}
                placeholder="Manzilni qidiring..."
                placeholderTextColor={C.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchLocation}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={C.textLight} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.mapCurrentBtn} onPress={getCurrentLocation}>
              <Ionicons name="locate" size={22} color={C.primary} />
            </TouchableOpacity>
          </View>

          {/* Map View */}
          <MapView
            ref={mapRef}
            style={styles.mapView}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton={false}
          >
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              draggable
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate
                setSelectedLocation(prev => ({ ...prev, latitude, longitude }))
                updateAddressFromCoords(latitude, longitude)
              }}
            >
              <View style={styles.markerContainer}>
                <LinearGradient colors={C.primaryGradient} style={styles.marker}>
                  <Ionicons name="location" size={20} color="#fff" />
                </LinearGradient>
                <View style={styles.markerPulse} />
              </View>
            </Marker>
          </MapView>

          {/* Selected Address Info */}
          <View style={styles.mapAddressContainer}>
            <View style={styles.mapAddressIcon}>
              <Ionicons name="location-outline" size={20} color={C.primary} />
            </View>
            <View style={styles.mapAddressContent}>
              <Text style={styles.mapAddressLabel}>Tanlangan joy</Text>
              <Text style={styles.mapAddressText} numberOfLines={2}>
                {selectedLocation.address || 'Xaritadan nuqtani belgilang'}
              </Text>
              <Text style={styles.mapCoordinates}>
                {selectedLocation.latitude.toFixed(4)}°, {selectedLocation.longitude.toFixed(4)}°
              </Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.mapSaveBtn} onPress={saveLocation}>
            <LinearGradient colors={C.primaryGradient} style={styles.mapSaveBtnGrad}>
              <Ionicons name="checkmark" size={20} color="#0A0D14" />
              <Text style={styles.mapSaveBtnText}>Joylashuvni saqlash</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: C.bg 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    gap: 12 
  },
  backBtn: { 
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  title: { 
    fontSize: 19, 
    fontWeight: '700', 
    color: C.text,
    letterSpacing: -0.4,
  },
  form: { 
    paddingHorizontal: 16 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: C.text, 
    marginBottom: 8, 
    marginTop: 18 
  },
  required: {
    color: C.danger,
  },
  counterText: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: '400',
  },
  input: { 
    backgroundColor: C.card, 
    borderRadius: 14, 
    paddingHorizontal: 16, 
    paddingVertical: Platform.OS === 'ios' ? 14 : 12, 
    fontSize: 15, 
    color: C.text,
    borderWidth: 1, 
    borderColor: C.border, 
    marginBottom: 4 
  },
  textArea: { 
    minHeight: 100, 
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  row: { 
    flexDirection: 'row', 
    gap: 12,
    marginTop: 4,
  },
  
  // Images Uploader
  imageRow: { 
    flexDirection: 'row', 
    marginVertical: 4,
  },
  imageContainer: { 
    position: 'relative' 
  },
  image: { 
    width: 94, 
    height: 94, 
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  removeImage: { 
    position: 'absolute', 
    top: 4, 
    right: 4, 
    backgroundColor: 'rgba(10, 13, 20, 0.75)', 
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  addImageBtn: { 
    width: 94, 
    height: 94, 
    borderRadius: 14, 
    backgroundColor: C.inputBg,
    borderWidth: 1.5, 
    borderColor: C.border, 
    borderStyle: 'dashed', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 4 
  },
  addImageText: { 
    fontSize: 11, 
    color: C.textLight,
    fontWeight: '500',
  },
  uploadingContainer: { 
    alignItems: 'center', 
    gap: 4 
  },
  uploadingText: { 
    fontSize: 11, 
    color: C.primary,
    fontWeight: '600',
  },

  // Categories
  categoryRow: { 
    flexDirection: 'row', 
    marginVertical: 4,
  },
  categoryBtn: { 
    paddingHorizontal: 16, 
    paddingVertical: 9, 
    borderRadius: 20, 
    backgroundColor: C.card, 
    borderWidth: 1, 
    borderColor: C.border 
  },
  categoryActive: { 
    backgroundColor: C.primaryGlow, 
    borderColor: C.primary 
  },
  categoryText: { 
    fontSize: 13.5, 
    color: C.textLight,
    fontWeight: '500' 
  },
  categoryTextActive: { 
    color: C.primary,
    fontWeight: '700' 
  },

  // Location Button
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
  },
  locationBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: C.textLight,
  },
  locationValue: {
    fontSize: 13,
    color: C.text,
    fontWeight: '500',
    marginTop: 2,
  },

  // Amenities
  amenitiesGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    marginVertical: 4 
  },
  amenityBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 14, 
    paddingVertical: 9, 
    borderRadius: 22, 
    backgroundColor: C.card, 
    borderWidth: 1, 
    borderColor: C.border 
  },
  amenityActive: { 
    backgroundColor: C.primaryGlow, 
    borderColor: C.primary 
  },
  amenityText: { 
    fontSize: 13, 
    color: C.textLight,
    fontWeight: '500',
  },
  amenityTextActive: {
    color: C.text,
    fontWeight: '600',
  },

  // Specs
  specInputWrapper: {
    flex: 1,
    gap: 4,
  },
  specSubLabel: {
    fontSize: 11.5,
    color: C.textLight,
    paddingLeft: 2,
  },
  specInput: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },

  // Submit
  submitBtnWrapper: {
    marginHorizontal: 16, 
    marginTop: 32,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  submitBtn: { 
    paddingVertical: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  submitText: { 
    color: '#0A0D14', 
    fontSize: 16, 
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  disabled: { 
    opacity: 0.5 
  },

  // Map Modal Styles
  mapModalContainer: {
    flex: 1,
    backgroundColor: C.bg,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
  },
  mapCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  mapSearchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  mapSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  mapSearchInput: {
    flex: 1,
    color: C.text,
    fontSize: 14,
  },
  mapCurrentBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  mapView: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.primary + '30',
    top: -8,
    left: -8,
  },
  mapAddressContainer: {
    flexDirection: 'row',
    backgroundColor: C.card,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  mapAddressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapAddressContent: {
    flex: 1,
  },
  mapAddressLabel: {
    fontSize: 11,
    color: C.textLight,
  },
  mapAddressText: {
    fontSize: 13,
    color: C.text,
    fontWeight: '500',
    marginTop: 2,
  },
  mapCoordinates: {
    fontSize: 11,
    color: C.textLight,
    marginTop: 4,
  },
  mapSaveBtn: {
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 40 : 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapSaveBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  mapSaveBtnText: {
    color: '#0A0D14',
    fontSize: 16,
    fontWeight: '700',
  },
})