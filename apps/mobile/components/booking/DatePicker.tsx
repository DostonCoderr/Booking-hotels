import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/colors'
import { api } from '@/services/api'

const { width } = Dimensions.get('window')
const CALENDAR_WIDTH = width - 80
const DAY_WIDTH = CALENDAR_WIDTH / 7

interface Props {
  listingId?: string
  checkIn: Date | null
  checkOut: Date | null
  onCheckInChange: (date: Date | null) => void
  onCheckOutChange: (date: Date | null) => void
}

export function DatePicker({ listingId, checkIn, checkOut, onCheckInChange, onCheckOutChange }: Props) {
  const [bookedDates, setBookedDates] = useState<string[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [showCalendar, setShowCalendar] = useState(false)

  // Band sanalarni yuklash
  useEffect(() => {
    if (listingId) {
      fetchBookedDates()
    } else {
      setLoading(false)
    }
  }, [listingId])

  // Oy o'zgarganda yoki listing o'zgarganda qayta yuklash
  useEffect(() => {
    if (listingId && showCalendar) {
      fetchBookedDates()
    }
  }, [currentMonth, listingId])

  const fetchBookedDates = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/listings/${listingId}/booked-dates`)
      setBookedDates(data)
      console.log('📅 Booked dates loaded:', data.length)
    } catch (error) {
      console.error('Fetch booked dates error:', error)
    } finally {
      setLoading(false)
    }
  }

  const isDateBooked = (date: Date) => {
    return bookedDates.includes(date.toDateString())
  }

  const generateDates = () => {
    const dates = []
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    // First day offset (Monday = 1, Sunday = 0 -> adjust)
    let startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
    
    // Empty cells for offset
    for (let i = 0; i < startOffset; i++) {
      dates.push({ date: null, isBooked: false, isSelected: false, isEmpty: true })
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      const isBooked = isDateBooked(date)
      const isSelected = (checkIn?.toDateString() === date.toDateString()) || 
                         (checkOut?.toDateString() === date.toDateString())
      const isInRange = checkIn && checkOut && date > checkIn && date < checkOut
      
      dates.push({ date, isBooked, isSelected, isInRange, isEmpty: false })
    }
    return dates
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Tanlang"
    return date.toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(currentMonth.getMonth() + increment)
    setCurrentMonth(newDate)
  }

  const handleDatePress = (date: Date) => {
    if (isDateBooked(date)) {
      // Band sanani tanlash mumkin emas
      return
    }
    
    if (!checkIn) {
      onCheckInChange(date)
    } else if (!checkOut && date > checkIn) {
      onCheckOutChange(date)
    } else {
      onCheckInChange(date)
      onCheckOutChange(null)
    }
  }

  // Check-in va Check-out o'rtasidagi kunlar soni
  const getNightsCount = () => {
    if (checkIn && checkOut) {
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }
    return 0
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Sanalar</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Sanalar yuklanmoqda...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sanalar</Text>
      
      <View style={styles.dateInputs}>
        <TouchableOpacity style={styles.dateBox} onPress={() => setShowCalendar(true)}>
          <Text style={styles.dateLabel}>Kirish</Text>
          <Text style={styles.dateValue}>{formatDate(checkIn)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateBox} onPress={() => setShowCalendar(true)}>
          <Text style={styles.dateLabel}>Chiqish</Text>
          <Text style={styles.dateValue}>{formatDate(checkOut)}</Text>
        </TouchableOpacity>
      </View>

      {/* Info about nights */}
      {checkIn && checkOut && (
        <View style={styles.nightsInfo}>
          <Ionicons name="moon-outline" size={16} color={COLORS.primary} />
          <Text style={styles.nightsText}>{getNightsCount()} kecha</Text>
        </View>
      )}

      {showCalendar && (
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNav}>
              <Ionicons name="chevron-back" size={20} color={COLORS.dark} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {currentMonth.toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNav}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.weekDays}>
            {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map(day => (
              <Text key={day} style={styles.weekDay}>{day}</Text>
            ))}
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.datesGrid}>
              {generateDates().map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCell,
                    item.isEmpty && styles.dateEmpty,
                    item.isBooked && styles.dateBooked,
                    item.isSelected && styles.dateSelected,
                    item.isInRange && styles.dateInRange
                  ]}
                  onPress={() => {
                    if (item.date && !item.isBooked) {
                      handleDatePress(item.date)
                      // Sanalarni tanlagandan keyin kalendarni yopish
                      if (checkIn && checkOut) {
                        setShowCalendar(false)
                      }
                    }
                  }}
                  disabled={item.isEmpty || item.isBooked}
                >
                  {item.date && (
                    <>
                      <Text style={[
                        styles.dateText,
                        item.isBooked && styles.dateTextBooked,
                        item.isSelected && styles.dateTextSelected,
                        item.isInRange && styles.dateTextInRange
                      ]}>
                        {item.date.getDate()}
                      </Text>
                      {item.isBooked && (
                        <View style={styles.bookedMark}>
                          <Ionicons name="close" size={8} color="#fff" />
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
              <Text style={styles.legendText}>Band</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.legendText}>Tanlangan</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.primary + '30' }]} />
              <Text style={styles.legendText}>Oraliq</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.closeCalendarBtn} onPress={() => setShowCalendar(false)}>
            <Text style={styles.closeCalendarText}>Yopish</Text>
          </TouchableOpacity>
        </View>
      )}

      {checkIn && checkOut && (
        <View style={styles.selectedDates}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
          <Text style={styles.selectedText}>
            {formatDate(checkIn)} - {formatDate(checkOut)}
          </Text>
          <Text style={styles.selectedNights}>({getNightsCount()} kecha)</Text>
        </View>
      )}
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
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  dateInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: COLORS.surface,
  },
  dateLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark,
  },
  nightsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  nightsText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  calendarContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthNav: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDay: {
    width: DAY_WIDTH,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: CALENDAR_WIDTH,
  },
  dateCell: {
    width: DAY_WIDTH,
    height: DAY_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: DAY_WIDTH / 2,
    position: 'relative',
  },
  dateEmpty: {
    opacity: 0,
  },
  dateBooked: {
    backgroundColor: '#F44336',
  },
  dateSelected: {
    backgroundColor: COLORS.primary,
  },
  dateInRange: {
    backgroundColor: COLORS.primary + '30',
    borderRadius: 0,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  dateTextBooked: {
    color: '#fff',
  },
  dateTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  dateTextInRange: {
    color: COLORS.dark,
  },
  bookedMark: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.gray,
  },
  closeCalendarBtn: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  closeCalendarText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  selectedDates: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  selectedText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
  },
  selectedNights: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
})