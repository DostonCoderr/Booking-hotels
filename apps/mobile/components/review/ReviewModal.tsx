import { useState } from 'react'
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { COLORS } from '@/constants/colors'

interface Props {
  visible: boolean
  listingId: string
  listingTitle: string
  onClose: () => void
  onSuccess: () => void
}

export function ReviewModal({ visible, listingId, listingTitle, onClose, onSuccess }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Xatolik', 'Iltimos, yulduzcha bosing')
      return
    }

    if (!comment.trim()) {
      Alert.alert('Xatolik', 'Iltimos, sharh yozing')
      return
    }

    setLoading(true)
    try {
      const { reviewService } = await import('@/services/review.service')
      await reviewService.createReview(listingId, { rating, comment })
      Alert.alert('Muvaffaqiyatli', 'Sharhingiz qoldirildi!')
      onSuccess()
      onClose()
      setRating(0)
      setComment('')
    } catch (error: any) {
      Alert.alert('Xatolik', error.response?.data?.message || 'Sharh qoldirishda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = () => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={40}
            color={i <= rating ? '#FFD700' : COLORS.gray}
          />
        </TouchableOpacity>
      )
    }
    return stars
  }

  const ratingLabels = {
    1: 'Yomon',
    2: 'Qoniqarsiz',
    3: 'Yaxshi',
    4: 'Juda yaxshi',
    5: 'Ajoyib!'
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.modalGradient}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconWrapper}>
                <Ionicons name="star-outline" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>Sharh qoldirish</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.listingTitle}>{listingTitle}</Text>
              <Text style={styles.subtitle}>Tajribangizni baholang</Text>

              {/* Stars */}
              <View style={styles.starsContainer}>
                {renderStars()}
              </View>

              {rating > 0 && (
                <Text style={styles.ratingLabel}>{ratingLabels[rating as keyof typeof ratingLabels]}</Text>
              )}

              {/* Comment Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Sharhingiz</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sayohatingiz haqida fikringizni yozing..."
                  placeholderTextColor={COLORS.gray}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.disabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.submitGradient}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.submitText}>Sharh qoldirish</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputWrapper: {
    gap: 8,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.dark,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 120,
  },
  submitBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabled: {
    opacity: 0.7,
  },
})