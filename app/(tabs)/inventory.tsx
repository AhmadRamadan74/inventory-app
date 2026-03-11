import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity, StatusBar
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

type Product = { id: string; name: string; category: string; quantity: number; price: number };

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "السباكة", electrical: "الكهرباء", smart: "الأنظمة الذكية",
};

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
      data.sort((a, b) => a.quantity - b.quantity);
      setProducts(data);
    } finally { setLoading(false); }
  };

  const getStatus = (qty: number) => {
    if (qty === 0) return { color: "#DC2626", bg: "#FEF2F2", label: "نفذ", icon: "close-circle" as const };
    if (qty <= 5) return { color: "#D97706", bg: "#FFFBEB", label: "منخفض", icon: "warning" as const };
    return { color: "#059669", bg: "#ECFDF5", label: "كافٍ", icon: "checkmark-circle" as const };
  };

  const outOfStock = products.filter((p) => p.quantity === 0).length;
  const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= 5).length;
  const sufficient = products.filter((p) => p.quantity > 5).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {lowStock + outOfStock > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning" size={16} color="#DC2626" />
          <Text style={styles.alertText}>{lowStock + outOfStock} منتج يحتاج إعادة تخزين</Text>
        </View>
      )}

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderTopColor: "#059669" }]}>
          <Text style={styles.summaryNumber}>{sufficient}</Text>
          <Text style={styles.summaryLabel}>كافٍ</Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: "#D97706" }]}>
          <Text style={styles.summaryNumber}>{lowStock}</Text>
          <Text style={styles.summaryLabel}>منخفض</Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: "#DC2626" }]}>
          <Text style={styles.summaryNumber}>{outOfStock}</Text>
          <Text style={styles.summaryLabel}>نفذ</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={fetchProducts}>
        <Ionicons name="refresh" size={15} color="#2563EB" />
        <Text style={styles.refreshText}>تحديث</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.emptyText}>لا توجد منتجات</Text>}
          renderItem={({ item }) => {
            const status = getStatus(item.quantity);
            return (
              <View style={styles.productCard}>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Ionicons name={status.icon} size={14} color={status.color} />
                  <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productCategory}>{CATEGORY_LABELS[item.category]}</Text>
                </View>
                <View style={styles.qtyBox}>
                  <Text style={[styles.qty, { color: status.color }]}>{item.quantity}</Text>
                  <Text style={styles.qtyLabel}>وحدة</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  alertBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF2F2", margin: 16, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: "#FECACA",
  },
  alertText: { color: "#DC2626", fontWeight: "600", fontSize: 13 },
  summaryRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  summaryCard: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12,
    padding: 12, alignItems: "center", borderTopWidth: 3,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  summaryNumber: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  summaryLabel: { fontSize: 11, color: "#64748B", marginTop: 2, fontWeight: "500" },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end", marginRight: 16, marginBottom: 4 },
  refreshText: { color: "#2563EB", fontSize: 13, fontWeight: "600" },
  emptyText: { color: "#94A3B8", textAlign: "center", marginTop: 40, fontSize: 15 },
  productCard: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14,
    marginBottom: 8, flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#E2E8F0", gap: 12,
  },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusLabel: { fontSize: 11, fontWeight: "700" },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: "700", color: "#0F172A", textAlign: "right" },
  productCategory: { fontSize: 12, color: "#94A3B8", textAlign: "right", marginTop: 2 },
  qtyBox: { alignItems: "center" },
  qty: { fontSize: 22, fontWeight: "800" },
  qtyLabel: { fontSize: 11, color: "#94A3B8" },
});