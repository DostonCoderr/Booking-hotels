import { Stack } from 'expo-router'

export default function ListingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  )
}