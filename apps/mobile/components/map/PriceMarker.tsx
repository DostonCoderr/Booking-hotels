import { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { COLORS } from '@/constants/colors'
 
interface Props {
  price: number
  selected?: boolean
  currency?: string
  size?: 'small' | 'medium' | 'large'
  withAnimation?: boolean
}
 
const SIZE_CONFIG = {
  small:  { px: 8,  py: 4, fs: 10, br: 14, mw: 36, aw: 5, ah: 6 },
  medium: { px: 11, py: 6, fs: 12, br: 18, mw: 46, aw: 6, ah: 7 },
  large:  { px: 14, py: 8, fs: 14, br: 22, mw: 58, aw: 7, ah: 8 },
}
 
export function PriceMarker({
  price,
  selected = false,
  currency = '$',
  size = 'medium',
  withAnimation = true,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const elevAnim  = useRef(new Animated.Value(0)).current
 
  useEffect(() => {
    if (!withAnimation) return
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: selected ? 1.18 : 1,
        useNativeDriver: true,
        tension: 120,
        friction: 7,
      }),
      Animated.timing(elevAnim, {
        toValue: selected ? 1 : 0,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start()
  }, [selected])
 
  const s = SIZE_CONFIG[size]
  const formattedPrice =
    price >= 1000
      ? `${currency}${(price / 1000).toFixed(1)}k`
      : `${currency}${price}`
 
  const shadowOpacity = elevAnim.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.38] })
  const shadowRadius  = elevAnim.interpolate({ inputRange: [0, 1], outputRange: [4, 12] })
 
  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Animated.View
        style={[
          styles.bubble,
          selected && styles.bubbleSelected,
          {
            paddingHorizontal: s.px,
            paddingVertical: s.py,
            borderRadius: s.br,
            minWidth: s.mw,
            shadowOpacity,
            shadowRadius,
            elevation: selected ? 8 : 3,
          },
        ]}
      >
        <Text style={[styles.label, { fontSize: s.fs }, selected && styles.labelSelected]}>
          {formattedPrice}
        </Text>
      </Animated.View>
 
      {/* Arrow tip */}
      <View
        style={[
          styles.arrow,
          {
            borderLeftWidth: s.aw,
            borderRightWidth: s.aw,
            borderTopWidth: s.ah,
            borderTopColor: selected ? COLORS.dark : COLORS.dark,
          },
        ]}
      />
    </Animated.View>
  )
}
 
const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  bubble: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.dark,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
  },
  bubbleSelected: {
    backgroundColor: COLORS.dark,
    borderColor: COLORS.dark,
  },
  label: {
    color: COLORS.dark,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  labelSelected: {
    color: COLORS.white,
    fontWeight: '800',
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
})
