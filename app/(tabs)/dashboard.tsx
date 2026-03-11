import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../../firebaseConfig";
import { router } from "expo-router";

const CATEGORIES = [
  { id: "plumbing", label: "السباكة", icon: "🔧", color: "#3b82f6" },
  { id: "electrical", label: "الكهرباء", icon: "⚡", color: "#f59e0b" },
  { id: "smart", label: "الأنظمة الذكية", icon: "📡", color: "#10b981" },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    lowStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const productsSnap = await getDocs(collection(db, "products"));
      const ordersSnap = await getDocs(collection(db, "orders"));

      let lowStock = 0;
      productsSnap.forEach((doc) => {
        if (doc.data().quantity <= 5) lowStock++;
      });

      setStats({
        totalProducts: productsSnap.size,
        totalOrders: ordersSnap.size,
        lowStock,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("تسجيل الخروج", "هل تريد تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          router.replace("/(auth)/login" as any);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>خروج</Text>
        </TouchableOpacity>
        <Text style={styles.title}>لوحة التحكم</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: "#3b82f6" }]}>
          <Text style={styles.statNumber}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>منتج</Text>
        </View>
        <View style={[styles.statCard, { borderColor: "#f59e0b" }]}>
          <Text style={styles.statNumber}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>طلب</Text>
        </View>
        <View style={[styles.statCard, { borderColor: "#ef4444" }]}>
          <Text style={styles.statNumber}>{stats.lowStock}</Text>
          <Text style={styles.statLabel}>مخزون منخفض</Text>
        </View>
      </View>

      {/* Categories */}
      <Text style={styles.sectionTitle}>الفئات</Text>
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[styles.categoryCard, { borderRightColor: cat.color }]}
          onPress={() =>
            router.push(`/(tabs)/products?category=${cat.id}` as any)
          }
        >
          <View style={styles.categoryLeft}>
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
          </View>
          <View style={styles.categoryRight}>
            <Text style={styles.categoryLabel}>{cat.label}</Text>
            <Text style={styles.categorySubtext}>اضغط لعرض المنتجات</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20 },
  centered: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  logoutBtn: {
    backgroundColor: "#ef444422",
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  logoutText: { color: "#ef4444", fontWeight: "bold" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    borderTopWidth: 3,
  },
  statNumber: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "right",
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRightWidth: 4,
  },
  categoryLeft: { marginLeft: 16 },
  categoryIcon: { fontSize: 32 },
  categoryRight: { flex: 1, alignItems: "flex-end" },
  categoryLabel: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  categorySubtext: { fontSize: 13, color: "#64748b", marginTop: 4 },
});
