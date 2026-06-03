import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { COLORS } from '@/constants/colors'

interface Props {
  fullScreen?: boolean
  message?: string
}

export function Loading({ fullScreen = false, message }: Props) {
  const content = (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  )

  if (fullScreen) {
    return content
  }

  return content
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray,
  },
})