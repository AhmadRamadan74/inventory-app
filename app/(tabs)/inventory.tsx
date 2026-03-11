import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

type Product = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "السباكة",
  electrical: "الكهرباء",
  smart: "الأنظمة الذكية",
};

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
      data.sort((a, b) => a.quantity - b.quantity);
      setProducts(data);
    } catch (e) {
      Alert.alert("خطأ", "فشل تحميل المخزون");
    } finally {
      setLoading(false);
    }
  };

  const lowStockProducts = products.filter((p) => p.quantity <= 5);
  const normalProducts = products.filter((p) => p.quantity > 5);

  const getStockColor = (qty: number) => {
    if (qty === 0) return "#ef4444";
    if (qty <= 5) return "#f59e0b";
    return "#10b981";
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productLeft}>
        <View
          style={[
            styles.stockIndicator,
            { backgroundColor: getStockColor(item.quantity) },
          ]}
        />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>
          {CATEGORY_LABELS[item.category] || item.category}
        </Text>
      </View>
      <View style={styles.productRight}>
        <Text
          style={[styles.quantity, { color: getStockColor(item.quantity) }]}
        >
          {item.quantity}
        </Text>
        <Text style={styles.quantityLabel}>وحدة</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>
            ⚠️ {lowStockProducts.length} منتج بمخزون منخفض
          </Text>
        </View>
      )}

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderColor: "#10b981" }]}>
          <Text style={styles.summaryNumber}>{normalProducts.length}</Text>
          <Text style={styles.summaryLabel}>مخزون كافٍ</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: "#f59e0b" }]}>
          <Text style={styles.summaryNumber}>
            {products.filter((p) => p.quantity > 0 && p.quantity <= 5).length}
          </Text>
          <Text style={styles.summaryLabel}>مخزون منخفض</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: "#ef4444" }]}>
          <Text style={styles.summaryNumber}>
            {products.filter((p) => p.quantity === 0).length}
          </Text>
          <Text style={styles.summaryLabel}>نفذ المخزون</Text>
        </View>
      </View>

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshBtn} onPress={fetchProducts}>
        <Text style={styles.refreshText}>🔄 تحديث</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#3b82f6"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>لا توجد منتجات في المخزون</Text>
          }
          renderItem={renderProduct}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  alertBanner: {
    backgroundColor: "#7c2d12",
    padding: 12,
    margin: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  alertText: {
    color: "#fca5a5",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: "center",
    borderTopWidth: 3,
  },
  summaryNumber: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  summaryLabel: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  refreshBtn: { alignSelf: "flex-end", marginRight: 16, marginBottom: 4 },
  refreshText: { color: "#3b82f6", fontSize: 14 },
  emptyText: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  productCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  productLeft: { marginRight: 12 },
  stockIndicator: { width: 12, height: 12, borderRadius: 6 },
  productInfo: { flex: 1 },
  productName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "right",
  },
  productCategory: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "right",
    marginTop: 2,
  },
  productRight: { alignItems: "center", marginLeft: 12 },
  quantity: { fontSize: 22, fontWeight: "bold" },
  quantityLabel: { color: "#64748b", fontSize: 11 },
});
