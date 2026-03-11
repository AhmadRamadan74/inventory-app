import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUserRole } from "../../hooks/useUserRole";
import { ActivityIndicator, View } from "react-native";

export default function TabsLayout() {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0f172a",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const isAdmin = role === "admin";

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: "#0f172a", borderTopColor: "#1e293b" },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#64748b",
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#fff",
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "الرئيسية",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "المنتجات",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="purchases"
        options={{
          title: "المشتريات",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "الطلبات",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "المخزون",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
