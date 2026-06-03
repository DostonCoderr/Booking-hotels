import { useState } from 'react'
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/colors'

interface Props {
  visible: boolean
  onClose: () => void
  onApply: (filters: any) => void
}

export function FilterModal({ visible, onClose, onApply }: Props) {
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(500)
  const [selectedType, setSelectedType] = useState('')

  const priceOptions = [0, 50, 100, 150, 200, 300, 400, 500]

  const handleApply = () => {
    onApply({ minPrice, maxPrice, type: selectedType })
    onClose()
  }

  const handleReset = () => {
    setMinPrice(0)
    setMaxPrice(500)
    setSelectedType('')
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filterlar</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Tozalash</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Minimal narx</Text>
            <View style={styles.priceOptions}>
              {priceOptions.map((price) => (
                <TouchableOpacity
                  key={price}
                  style={[styles.priceOption, minPrice === price && styles.priceOptionSelected]}
                  onPress={() => setMinPrice(price)}
                >
                  <Text style={[styles.priceOptionText, minPrice === price && styles.priceOptionTextSelected]}>
                    ${price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maksimal narx</Text>
            <View style={styles.priceOptions}>
              {priceOptions.map((price) => (
                <TouchableOpacity
                  key={price}
                  style={[styles.priceOption, maxPrice === price && styles.priceOptionSelected]}
                  onPress={() => setMaxPrice(price)}
                >
                  <Text style={[styles.priceOptionText, maxPrice === price && styles.priceOptionTextSelected]}>
                    ${price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Turar joy turi</Text>
            <View style={styles.typeGrid}>
              {['Uy', 'Kvartira', 'Loft', 'Dacha', 'Villa', 'Studiya'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeBtn, selectedType === type && styles.typeBtnSelected]}
                  onPress={() => setSelectedType(type === selectedType ? '' : type)}
                >
                  <Text style={[styles.typeText, selectedType === type && styles.typeTextSelected]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyBtnText}>Qo'llash</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.dark },
  resetText: { color: COLORS.primary, fontSize: 14, fontWeight: '500' },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.dark, marginBottom: 16 },
  priceOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  priceOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  priceOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  priceOptionText: { fontSize: 14, color: COLORS.dark },
  priceOptionTextSelected: { color: '#fff' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  typeBtnSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeText: { fontSize: 14, color: COLORS.dark },
  typeTextSelected: { color: '#fff' },
  bottomBar: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})