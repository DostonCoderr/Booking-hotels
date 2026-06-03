import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/colors'

interface Props {
  guests: number
  maxGuests: number
  onGuestsChange: (guests: number) => void
}

export function GuestPicker({ guests, maxGuests, onGuestsChange }: Props) {
  const [modalVisible, setModalVisible] = useState(false)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Mehmonlar</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
        <Text style={styles.value}>
          {guests} {guests === 1 ? 'mehmon' : 'mehmon'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.doneBtn}>Bajarildi</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContainer}>
              <View style={styles.pickerRow}>
                <Text style={styles.pickerLabel}>Mehmonlar</Text>
                <View style={styles.counter}>
                  <TouchableOpacity
                    style={[styles.counterBtn, guests <= 1 && styles.disabled]}
                    onPress={() => guests > 1 && onGuestsChange(guests - 1)}
                    disabled={guests <= 1}
                  >
                    <Ionicons name="remove" size={20} color={guests <= 1 ? COLORS.gray : COLORS.dark} />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{guests}</Text>
                  <TouchableOpacity
                    style={[styles.counterBtn, guests >= maxGuests && styles.disabled]}
                    onPress={() => guests < maxGuests && onGuestsChange(guests + 1)}
                    disabled={guests >= maxGuests}
                  >
                    <Ionicons name="add" size={20} color={guests >= maxGuests ? COLORS.gray : COLORS.dark} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.maxText}>Maksimal {maxGuests} mehmon</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 12,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
  },
  value: {
    fontSize: 15,
    color: COLORS.dark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  doneBtn: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    padding: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 16,
    color: COLORS.dark,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.dark,
    minWidth: 24,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  maxText: {
    marginTop: 12,
    fontSize: 12,
    color: COLORS.gray,
  },
})