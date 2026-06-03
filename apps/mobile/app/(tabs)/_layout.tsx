import { Tabs } from 'expo-router'
import { CustomTabBar } from '@/components/common/CustomTabBar'
import { View } from 'react-native'

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Bosh sahifa' }} />
        <Tabs.Screen name="search" options={{ title: 'Qidirish' }} />
        <Tabs.Screen name="map" options={{ title: 'Xarita' }} />
        <Tabs.Screen name="wishlist" options={{ title: 'Saqlangan' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
        
        {/* Yashirin tablar - faqat navigatsiya uchun */}
        <Tabs.Screen name="bookings" options={{ href: null }} />
        <Tabs.Screen name="trips" options={{ href: null }} />
        <Tabs.Screen name="messages" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="payments" options={{ href: null }} />
        <Tabs.Screen name="support" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
      </Tabs>
    </View>
  )
}