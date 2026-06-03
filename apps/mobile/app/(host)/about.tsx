// app/(host)/about.tsx

import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Linking, Platform } from 'react-native'
import { useEffect, useRef } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'

const rf = (n: number) => n // Moslashuvchan shriftlar uchun tayyor struktura

// Premium Dark Cyber Palette
const C = {
  bg: '#0A0D14',
  card: 'rgba(16, 20, 30, 0.85)',
  primary: '#38BDF8',         // Neon Havorang
  primaryGradient: ['#00F2FE', '#4FACFE'] as const,
  accent: '#A78BFA',          // Neon Binafsha
  accentGradient: ['#C084FC', '#8B5CF6'] as const,
  text: '#F3F4F6',
  textLight: '#9CA3AF',
  textMuted: '#4B5563',
  border: 'rgba(255, 255, 255, 0.06)',
}

interface AboutModalProps {
  visible: boolean
  onClose: () => void
}

export default function AboutModal({ visible, onClose }: AboutModalProps) {
  const slideAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 9 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 0 }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start()
    }
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        
        <Animated.View 
          style={[
            styles.modal, 
            { 
              transform: [{ 
                translateY: slideAnim.interpolate({ 
                  inputRange: [0, 1], 
                  outputRange: [600, 0] 
                }) 
              }] 
            }
          ]}
        >
          {/* Blur Overlay for Glassmorphism Effect */}
          {Platform.OS === 'ios' && (
            <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFillObject} />
          )}

          <View style={styles.modalHeader}>
            <View style={styles.modalHandle} />
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={C.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* App Logo with Dynamic Cyber Radial Glow */}
            <View style={styles.logoContainer}>
              <LinearGradient colors={C.primaryGradient} style={styles.logoGlow} />
              <LinearGradient colors={C.primaryGradient} style={styles.logo}>
                <Text style={styles.logoText}>S</Text>
              </LinearGradient>
            </View>

            <Text style={styles.appName}>StayHub</Text>
            <Text style={styles.appVersion}>Versiya 1.0.0</Text>

            <View style={styles.divider} />

            <Text style={styles.description}>
              StayHub — bu mehmonxona va turar joy egalari uchun yaratilgan zamonaviy premium platforma. 
              Mijozlaringiz bilan tezkor bog'laning, bronlarni avtomatlashtirilgan tizimda boshqaring va biznesingiz unumdorligini oshiring.
            </Text>

            {/* Statistics Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={[styles.iconWrapper, { backgroundColor: C.primary + '12' }]}>
                  <Ionicons name="people-outline" size={20} color={C.primary} />
                </View>
                <Text style={styles.infoLabel}>500+</Text>
                <Text style={styles.infoText}>Faol foydalanuvchi</Text>
              </View>

              <View style={styles.infoItem}>
                <View style={[styles.iconWrapper, { backgroundColor: C.accent + '12' }]}>
                  <Ionicons name="business-outline" size={20} color={C.accent} />
                </View>
                <Text style={styles.infoLabel}>200+</Text>
                <Text style={styles.infoText}>Joylashgan uylar</Text>
              </View>

              <View style={styles.infoItem}>
                <View style={[styles.iconWrapper, { backgroundColor: '#FBBF2412' }]}>
                  <Ionicons name="star-outline" size={20} color="#FBBF24" />
                </View>
                <Text style={styles.infoLabel}>4.8</Text>
                <Text style={styles.infoText}>O'rtacha reyting</Text>
              </View>
            </View>

            {/* Social Network Actions */}
            <View style={styles.socialLinks}>
              <TouchableOpacity style={[styles.socialBtn, { borderColor: 'rgba(42, 171, 238, 0.2)' }]} onPress={() => Linking.openURL('https://t.me/stayhub')} activeOpacity={0.7}>
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#2AABEE', opacity: 0.05 }]} />
                <Ionicons name="paper-plane-outline" size={20} color="#2AABEE" />
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.socialBtn, { borderColor: 'rgba(228, 64, 95, 0.2)' }]} onPress={() => Linking.openURL('https://instagram.com/stayhub')} activeOpacity={0.7}>
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#E4405F', opacity: 0.05 }]} />
                <Ionicons name="logo-instagram" size={20} color="#E4405F" />
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.socialBtn, { borderColor: 'rgba(24, 119, 242, 0.2)' }]} onPress={() => Linking.openURL('https://facebook.com/stayhub')} activeOpacity={0.7}>
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#1877F2', opacity: 0.05 }]} />
                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
              </TouchableOpacity>
            </View>

            <Text style={styles.copyright}>© 2026 StayHub. Barcha huquqlar himoyalangan.</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(4, 6, 10, 0.82)', 
    justifyContent: 'flex-end' 
  },
  modal: { 
    backgroundColor: Platform.OS === 'ios' ? 'rgba(16, 20, 30, 0.75)' : '#10141E', 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: { 
    height: 44, 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative'
  },
  modalHandle: { 
    width: 42, 
    height: 4, 
    borderRadius: 2, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    marginTop: 8 
  },
  closeBtn: { 
    position: 'absolute', 
    right: 20, 
    top: 14, 
    width: 30, 
    height: 30, 
    borderRadius: 10, 
    backgroundColor: 'rgba(255,255,255,0.04)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border
  },
  modalContent: { 
    paddingHorizontal: 24, 
    paddingTop: 10,
    alignItems: 'center' 
  },
  
  // Cyber Logo Elements
  logoContainer: { 
    marginBottom: 16,
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    opacity: 0.25,
    transform: [{ scale: 1.15 }],
  },
  logo: { 
    width: 74, 
    height: 74, 
    borderRadius: 24, // Squircle cyber dynamic look
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  logoText: { 
    fontSize: 34, 
    fontWeight: '900', 
    color: '#0A0D14',
    letterSpacing: -1,
  },
  appName: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: C.text, 
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  appVersion: { 
    fontSize: 12.5, 
    color: C.textLight, 
    fontWeight: '500',
    marginBottom: 10 
  },
  divider: { 
    width: 40, 
    height: 2, 
    backgroundColor: C.border, 
    marginVertical: 14 
  },
  description: { 
    fontSize: 13.5, 
    color: C.textLight, 
    textAlign: 'center', 
    lineHeight: 21, 
    marginBottom: 24,
    fontWeight: '400',
    paddingHorizontal: 10,
  },
  
  // Custom Analytics Icons Grid
  infoGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%', 
    marginBottom: 28,
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  infoItem: { 
    flex: 1,
    alignItems: 'center', 
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: C.text,
    letterSpacing: -0.3,
  },
  infoText: { 
    fontSize: 11, 
    color: C.textLight,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Social Actions Style
  socialLinks: { 
    flexDirection: 'row', 
    gap: 16, 
    marginBottom: 24 
  },
  socialBtn: { 
    width: 46, 
    height: 46, 
    borderRadius: 14, 
    backgroundColor: 'rgba(255,255,255,0.02)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  copyright: { 
    fontSize: 11, 
    color: C.textMuted, 
    textAlign: 'center',
    fontWeight: '500',
  },
})