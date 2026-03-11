import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUserRole } from "../../hooks/useUserRole";
import { ActivityIndicator, View } from "react-native";

export default function TabsLayout() {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const isAdmin = role === "admin";

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle: { backgroundColor: "#FFFFFF", borderBottomColor: "#E2E8F0", borderBottomWidth: 1 },
        headerTintColor: "#0F172A",
        headerTitleStyle: { fontWeight: "700", fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="dashboard" options={{
        title: "الرئيسية",
        tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
      }} />
      <Tabs.Screen name="products" options={{
        title: "المنتجات",
        href: isAdmin ? undefined : null,
        tabBarIcon: ({ color, size }) => <Ionicons name="cube" size={size} color={color} />,
      }} />
      <Tabs.Screen name="purchases" options={{
        title: "المشتريات",
        href: isAdmin ? undefined : null,
        tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
      }} />
      <Tabs.Screen name="orders" options={{
        title: "الطلبات",
        tabBarIcon: ({ color, size }) => <Ionicons name="clipboard" size={size} color={color} />,
      }} />
      <Tabs.Screen name="inventory" options={{
        title: "المخزون",
        tabBarIcon: ({ color, size }) => <Ionicons name="layers" size={size} color={color} />,
      }} />
    </Tabs>
  );
}