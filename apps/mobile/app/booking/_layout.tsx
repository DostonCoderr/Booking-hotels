import { Stack } from 'expo-router'

export default function BookingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="confirm" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  )
}