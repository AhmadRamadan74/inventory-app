import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, StatusBar
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../../firebaseConfig";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUserRole } from "../../hooks/useUserRole";

const CATEGORIES = [
  { id: "plumbing", label: "السباكة", icon: "build" as const, color: "#2563EB", bg: "#EFF6FF" },
  { id: "electrical", label: "الكهرباء", icon: "flash" as const, color: "#D97706", bg: "#FFFBEB" },
  { id: "smart", label: "الأنظمة الذكية", icon: "wifi" as const, color: "#059669", bg: "#ECFDF5" },
];

export default function Dashboard() {
  const { userName } = useUserRole();
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const [productsSnap, ordersSnap] = await Promise.all([
        getDocs(collection(db, "products")),
        getDocs(collection(db, "orders")),
      ]);
      let lowStock = 0;
      productsSnap.forEach((doc) => { if (doc.data().quantity <= 5) lowStock++; });
      setStats({ totalProducts: productsSnap.size, totalOrders: ordersSnap.size, lowStock });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("تسجيل الخروج", "هل تريد تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "خروج", style: "destructive", onPress: async () => {
        await signOut(auth);
        router.replace("/(auth)/login" as any);
      }},
    ]);
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>مرحباً، {userName || "المستخدم"}</Text>
          <Text style={styles.date}>نظام إدارة المخزون</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: "#2563EB" }]}>
          <Text style={styles.statNumber}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>منتج</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: "#059669" }]}>
          <Text style={styles.statNumber}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>طلب</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: "#DC2626" }]}>
          <Text style={[styles.statNumber, stats.lowStock > 0 && { color: "#DC2626" }]}>{stats.lowStock}</Text>
          <Text style={styles.statLabel}>مخزون منخفض</Text>
        </View>
      </View>

      {/* Categories */}
      <Text style={styles.sectionTitle}>الفئات</Text>
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={styles.categoryCard}
          onPress={() => router.push(`/(tabs)/products?category=${cat.id}` as any)}
          activeOpacity={0.7}
        >
          <View style={styles.categoryRight}>
            <Text style={styles.categoryLabel}>{cat.label}</Text>
            <Text style={styles.categorySubtext}>اضغط لعرض المنتجات</Text>
          </View>
          <View style={[styles.categoryIcon, { backgroundColor: cat.bg }]}>
            <Ionicons name={cat.icon} size={24} color={cat.color} />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 32 },
  centered: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  headerText: { alignItems: "flex-end" },
  greeting: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  date: { fontSize: 13, color: "#64748B", marginTop: 2 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#FEF2F2", justifyContent: "center",
    alignItems: "center", borderWidth: 1, borderColor: "#FECACA",
  },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 14,
    padding: 16, alignItems: "center", borderTopWidth: 3,
    borderWidth: 1, borderColor: "#E2E8F0",
    shadowColor: "#0F172A", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statNumber: { fontSize: 28, fontWeight: "800", color: "#0F172A" },
  statLabel: { fontSize: 11, color: "#64748B", marginTop: 4, textAlign: "center", fontWeight: "500" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", textAlign: "right", marginBottom: 12 },
  categoryCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 18,
    marginBottom: 10, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: "#E2E8F0",
    shadowColor: "#0F172A", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  categoryIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  categoryRight: { alignItems: "flex-end" },
  categoryLabel: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  categorySubtext: { fontSize: 12, color: "#94A3B8", marginTop: 3 },
});