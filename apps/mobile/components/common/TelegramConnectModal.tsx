import { useState } from 'react'
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Linking
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { COLORS } from '@/constants/colors'

interface Props {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

export function TelegramConnectModal({ visible, onClose, onSuccess }: Props) {
  const [chatId, setChatId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    if (!chatId.trim()) {
      Alert.alert('Xatolik', 'Iltimos, chat ID ni kiriting')
      return
    }

    setLoading(true)
    try {
      const { notificationService } = await import('@/services/notification.service')
      await notificationService.saveTelegramChatId(chatId.trim())
      Alert.alert('Muvaffaqiyatli', 'Telegram ulandi! Endi sayohat eslatmalarini olasiz')
      onSuccess()
      onClose()
      setChatId('')
    } catch (error) {
      Alert.alert('Xatolik', 'Telegram ulashda xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const openTelegramBot = () => {
    Linking.openURL('https://t.me/hotel_reminding_bot')
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.modalGradient}>
            <View style={styles.header}>
              <View style={styles.iconWrapper}>
                <Ionicons name="send" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>Telegram ulash</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <Text style={styles.description}>
                Sayohat eslatmalarini Telegram orqali olish uchun botga ulaning
              </Text>

              <TouchableOpacity style={styles.botBtn} onPress={openTelegramBot}>
                <LinearGradient colors={['#27A0E0', '#1E88E5']} style={styles.botBtnGradient}>
                  <Ionicons name="send" size={22} color="#fff" />
                  <Text style={styles.botBtnText}>@hotel_reminding_bot</Text>
                  <Ionicons name="open-outline" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.steps}>
                <Text style={styles.stepsTitle}>Qanday ulanish?</Text>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Botga /start yozing</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>Bot sizga chat ID ni beradi</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>Chat ID ni pastga yozing</Text>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Chat ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masalan: 123456789"
                  placeholderTextColor={COLORS.gray}
                  value={chatId}
                  onChangeText={setChatId}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={[styles.connectBtn, loading && styles.disabled]}
                onPress={handleConnect}
                disabled={loading}
              >
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.connectBtnGradient}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.connectBtnText}>Ulanish</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
  content: {
    gap: 16,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  botBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  botBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  botBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  steps: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  stepText: {
    fontSize: 13,
    color: COLORS.dark,
    flex: 1,
  },
  inputWrapper: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.dark,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  connectBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  connectBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  connectBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabled: {
    opacity: 0.7,
  },
})