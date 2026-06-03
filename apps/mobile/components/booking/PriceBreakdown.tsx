import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '@/constants/colors'

interface Props {
  pricePerNight: number
  nights: number
  total: number
}

export function PriceBreakdown({ pricePerNight, nights, total }: Props) {
  const cleaningFee = total * 0.1
  const serviceFee = total * 0.05
  const finalTotal = total + cleaningFee + serviceFee

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Narxlar</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>
          ${pricePerNight} × {nights} kecha
        </Text>
        <Text style={styles.value}>${total}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Tozalash to'lovi</Text>
        <Text style={styles.value}>${cleaningFee.toFixed(2)}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Xizmat haqi</Text>
        <Text style={styles.value}>${serviceFee.toFixed(2)}</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Jami</Text>
        <Text style={styles.totalValue}>${finalTotal.toFixed(2)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: COLORS.gray,
  },
  value: {
    fontSize: 14,
    color: COLORS.dark,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
})