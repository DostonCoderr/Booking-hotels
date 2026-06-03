import { Stack } from 'expo-router'

export default function MessagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[userId]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  )
}