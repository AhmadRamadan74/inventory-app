import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Modal, ScrollView, TextInput
} from "react-native";
import {
  collection, getDocs, addDoc, updateDoc, doc, Timestamp
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useUserRole } from "../../hooks/useUserRole";

type Product = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
};

type CartItem = {
  product: Product;
  quantity: number;
};

type Order = {
  id: string;
  engineerName: string;
  engineerId: string;
  items: { productId: string; productName: string; quantity: number }[];
  status: "pending" | "approved" | "rejected";
  note: string;
  createdAt: any;
};

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "السباكة",
  electrical: "الكهرباء",
  smart: "الأنظمة الذكية",
};

const CATEGORIES = [
  { id: "all", label: "الكل" },
  { id: "plumbing", label: "السباكة" },
  { id: "electrical", label: "الكهرباء" },
  { id: "smart", label: "الأنظمة الذكية" },
];

export default function OrdersScreen() {
  const { role, userId, userName, loading: roleLoading } = useUserRole();

  if (roleLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (role === "admin") return <AdminOrders />;
  return <EngineerOrders userId={userId!} userName={userName} />;
}

// ─── ADMIN VIEW ───────────────────────────────────────────────
function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "orders"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (order: Order, decision: "approved" | "rejected") => {
    const label = decision === "approved" ? "قبول" : "رفض";
    Alert.alert(`${label} الطلب`, `هل تريد ${label} هذا الطلب؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: label,
        onPress: async () => {
          await updateDoc(doc(db, "orders", order.id), { status: decision });

          if (decision === "approved") {
            // Reduce stock for each item
            for (const item of order.items) {
              const productSnap = await getDocs(collection(db, "products"));
              const productDoc = productSnap.docs.find((d) => d.id === item.productId);
              if (productDoc) {
                const currentQty = productDoc.data().quantity;
                const newQty = Math.max(0, currentQty - item.quantity);
                await updateDoc(doc(db, "products", item.productId), { quantity: newQty });
              }
            }
          }

          fetchOrders();
          Alert.alert("تم", `تم ${label} الطلب بنجاح`);
        },
      },
    ]);
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const statusLabel = (s: string) =>
    s === "pending" ? "قيد الانتظار" : s === "approved" ? "مقبول" : "مرفوض";
  const statusColor = (s: string) =>
    s === "pending" ? "#f59e0b" : s === "approved" ? "#10b981" : "#ef4444";

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>إدارة الطلبات</Text>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "all" ? "الكل" : statusLabel(f)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.emptyText}>لا توجد طلبات</Text>}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + "33", borderColor: statusColor(item.status) }]}>
                  <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
                    {statusLabel(item.status)}
                  </Text>
                </View>
                <Text style={styles.engineerName}>{item.engineerName}</Text>
              </View>

              {item.items.map((i, idx) => (
                <Text key={idx} style={styles.orderItem}>
                  • {i.productName} × {i.quantity}
                </Text>
              ))}

              {item.note ? (
                <Text style={styles.orderNote}>ملاحظة: {item.note}</Text>
              ) : null}

              {item.status === "pending" && (
                <View style={styles.orderActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#10b981" }]}
                    onPress={() => handleDecision(item, "approved")}
                  >
                    <Text style={styles.actionBtnText}>قبول</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
                    onPress={() => handleDecision(item, "rejected")}
                  >
                    <Text style={styles.actionBtnText}>رفض</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

// ─── ENGINEER VIEW ────────────────────────────────────────────
function EngineerOrders({ userId, userName }: { userId: string; userName: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartVisible, setCartVisible] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [view, setView] = useState<"shop" | "myorders">("shop");

  useEffect(() => { fetchProducts(); fetchMyOrders(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOrders = async () => {
    const snap = await getDocs(collection(db, "orders"));
    const data = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Order))
      .filter((o) => o.engineerId === userId)
      .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
    setMyOrders(data);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find((c) => c.product.id === product.id);
    if (existing) {
      setCart(cart.map((c) =>
        c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    Alert.alert("تمت الإضافة", `تم إضافة ${product.name} إلى السلة`);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((c) => c.product.id !== productId));
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      Alert.alert("خطأ", "السلة فارغة");
      return;
    }
    try {
      await addDoc(collection(db, "orders"), {
        engineerId: userId,
        engineerName: userName,
        items: cart.map((c) => ({
          productId: c.product.id,
          productName: c.product.name,
          quantity: c.quantity,
        })),
        status: "pending",
        note,
        createdAt: Timestamp.now(),
      });
      setCart([]);
      setNote("");
      setCartVisible(false);
      fetchMyOrders();
      Alert.alert("تم", "تم إرسال طلبك وسيتم مراجعته من المدير");
    } catch (e) {
      Alert.alert("خطأ", "فشل إرسال الطلب");
    }
  };

  const filtered = selectedCategory === "all"
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const statusLabel = (s: string) =>
    s === "pending" ? "قيد الانتظار" : s === "approved" ? "مقبول" : "مرفوض";
  const statusColor = (s: string) =>
    s === "pending" ? "#f59e0b" : s === "approved" ? "#10b981" : "#ef4444";

  return (
    <View style={styles.container}>
      {/* Top Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === "shop" && styles.toggleBtnActive]}
          onPress={() => setView("shop")}
        >
          <Text style={[styles.toggleText, view === "shop" && styles.toggleTextActive]}>تصفح المنتجات</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === "myorders" && styles.toggleBtnActive]}
          onPress={() => { setView("myorders"); fetchMyOrders(); }}
        >
          <Text style={[styles.toggleText, view === "myorders" && styles.toggleTextActive]}>طلباتي</Text>
        </TouchableOpacity>
      </View>

      {view === "shop" ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterBtn, selectedCategory === cat.id && styles.filterBtnActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.filterText, selectedCategory === cat.id && styles.filterTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={<Text style={styles.emptyText}>لا توجد منتجات</Text>}
              renderItem={({ item }) => (
                <View style={styles.productCard}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productCategory}>{CATEGORY_LABELS[item.category]}</Text>
                    <Text style={styles.productQty}>المتاح: {item.quantity} وحدة</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.addToCartBtn, item.quantity === 0 && styles.disabledBtn]}
                    onPress={() => item.quantity > 0 && addToCart(item)}
                    disabled={item.quantity === 0}
                  >
                    <Text style={styles.addToCartText}>
                      {item.quantity === 0 ? "نفذ" : "+ أضف"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          {/* Cart Button */}
          {cart.length > 0 && (
            <TouchableOpacity style={styles.cartBtn} onPress={() => setCartVisible(true)}>
              <Text style={styles.cartBtnText}>🛒 السلة ({cart.length})</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <FlatList
          data={myOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.emptyText}>لا توجد طلبات</Text>}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + "33", borderColor: statusColor(item.status) }]}>
                  <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
                    {statusLabel(item.status)}
                  </Text>
                </View>
                <Text style={styles.engineerName}>طلبي</Text>
              </View>
              {item.items.map((i, idx) => (
                <Text key={idx} style={styles.orderItem}>• {i.productName} × {i.quantity}</Text>
              ))}
            </View>
          )}
        />
      )}

      {/* Cart Modal */}
      <Modal visible={cartVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>السلة</Text>
            {cart.map((item) => (
              <View key={item.product.id} style={styles.cartItem}>
                <TouchableOpacity onPress={() => removeFromCart(item.product.id)}>
                  <Text style={styles.removeBtn}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.cartItemQty}>× {item.quantity}</Text>
                <Text style={styles.cartItemName}>{item.product.name}</Text>
              </View>
            ))}
            <TextInput
              style={styles.input}
              placeholder="ملاحظات (اختياري)"
              placeholderTextColor="#64748b"
              value={note}
              onChangeText={setNote}
              textAlign="right"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={submitOrder}>
                <Text style={styles.saveBtnText}>إرسال الطلب</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCartVisible(false)}>
                <Text style={styles.cancelBtnText}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  centered: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  pageTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "right",
    padding: 16,
  },
  toggleRow: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
  toggleBtnActive: { backgroundColor: "#3b82f6" },
  toggleText: { color: "#64748b", fontWeight: "bold" },
  toggleTextActive: { color: "#fff" },
  filterRow: { paddingHorizontal: 16, marginBottom: 8 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1e293b",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  filterBtnActive: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  filterText: { color: "#94a3b8", fontSize: 14 },
  filterTextActive: { color: "#fff", fontWeight: "bold" },
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
    gap: 12,
  },
  productInfo: { flex: 1 },
  productName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "right",
  },
  productCategory: {
    color: "#3b82f6",
    fontSize: 12,
    textAlign: "right",
    marginTop: 2,
  },
  productQty: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "right",
    marginTop: 2,
  },
  addToCartBtn: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  disabledBtn: { backgroundColor: "#334155" },
  addToCartText: { color: "#fff", fontWeight: "bold" },
  cartBtn: {
    backgroundColor: "#3b82f6",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  cartBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  orderCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  engineerName: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusText: { fontSize: 13, fontWeight: "bold" },
  orderItem: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "right",
    marginBottom: 4,
  },
  orderNote: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "right",
    marginTop: 6,
  },
  orderActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, borderRadius: 8, padding: 10, alignItems: "center" },
  actionBtnText: { color: "#fff", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  cartItemName: { color: "#fff", fontSize: 15, flex: 1, textAlign: "right" },
  cartItemQty: { color: "#94a3b8", fontSize: 14, marginHorizontal: 8 },
  removeBtn: { color: "#ef4444", fontSize: 16, marginLeft: 8 },
  input: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 15,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#334155",
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 12 },
  saveBtn: {
    flex: 1,
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#334155",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  cancelBtnText: { color: "#fff", fontSize: 16, textAlign: "center" },
});
