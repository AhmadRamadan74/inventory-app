import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator, ScrollView, StatusBar
} from "react-native";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = [
  { id: "all", label: "الكل" },
  { id: "plumbing", label: "السباكة" },
  { id: "electrical", label: "الكهرباء" },
  { id: "smart", label: "الأنظمة الذكية" },
];

type Product = { id: string; name: string; category: string; quantity: number; price: number };
const EMPTY_FORM = { name: "", category: "plumbing", quantity: "", price: "" };

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { filterProducts(); }, [search, selectedCategory, products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
    } finally { setLoading(false); }
  };

  const filterProducts = () => {
    let result = [...products];
    if (selectedCategory !== "all") result = result.filter((p) => p.category === selectedCategory);
    if (search.trim()) result = result.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  };

  const handleSave = async () => {
    if (!form.name || !form.quantity || !form.price) { Alert.alert("خطأ", "يرجى ملء جميع الحقول"); return; }
    const data = { name: form.name, category: form.category, quantity: Number(form.quantity), price: Number(form.price), image: "" };
    try {
      if (editingProduct) await updateDoc(doc(db, "products", editingProduct.id), data);
      else await addDoc(collection(db, "products"), data);
      setModalVisible(false);
      fetchProducts();
    } catch { Alert.alert("خطأ", "فشل حفظ المنتج"); }
  };

  const handleDelete = (product: Product) => {
    Alert.alert("حذف المنتج", `هل تريد حذف "${product.name}"؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: async () => { await deleteDoc(doc(db, "products", product.id)); fetchProducts(); } },
    ]);
  };

  const getCategoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label || id;

  const getCategoryColor = (id: string) => {
    if (id === "plumbing") return { color: "#2563EB", bg: "#EFF6FF" };
    if (id === "electrical") return { color: "#D97706", bg: "#FFFBEB" };
    return { color: "#059669", bg: "#ECFDF5" };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن منتج..."
          placeholderTextColor="#CBD5E1"
          value={search}
          onChangeText={setSearch}
          textAlign="right"
        />
        {search ? <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={18} color="#94A3B8" /></TouchableOpacity> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.filterBtn, selectedCategory === cat.id && styles.filterBtnActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={[styles.filterText, selectedCategory === cat.id && styles.filterTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>لا توجد منتجات</Text>
            </View>
          }
          renderItem={({ item }) => {
            const { color, bg } = getCategoryColor(item.category);
            return (
              <View style={styles.productCard}>
                <View style={styles.productMain}>
                  <View style={[styles.productCategoryBadge, { backgroundColor: bg }]}>
                    <Text style={[styles.productCategoryText, { color }]}>{getCategoryLabel(item.category)}</Text>
                  </View>
                  <Text style={styles.productName}>{item.name}</Text>
                  <View style={styles.productMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaValue}>{item.price}</Text>
                      <Text style={styles.metaLabel}>ر.س</Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                      <Text style={[styles.metaValue, item.quantity <= 5 && { color: "#DC2626" }]}>{item.quantity}</Text>
                      <Text style={styles.metaLabel}>وحدة</Text>
                    </View>
                  </View>
                  {item.quantity <= 5 && (
                    <View style={styles.lowStockBadge}>
                      <Ionicons name="warning" size={12} color="#DC2626" />
                      <Text style={styles.lowStockText}>مخزون منخفض</Text>
                    </View>
                  )}
                </View>
                <View style={styles.productActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => {
                    setEditingProduct(item);
                    setForm({ name: item.name, category: item.category, quantity: String(item.quantity), price: String(item.price) });
                    setModalVisible(true);
                  }}>
                    <Ionicons name="pencil" size={16} color="#2563EB" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                    <Ionicons name="trash" size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingProduct(null); setForm(EMPTY_FORM); setModalVisible(true); }}>
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addBtnText}>إضافة منتج</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</Text>
            </View>

            <Text style={styles.inputLabel}>اسم المنتج</Text>
            <TextInput style={styles.input} placeholder="أدخل اسم المنتج" placeholderTextColor="#CBD5E1" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} textAlign="right" />

            <Text style={styles.inputLabel}>الفئة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                <TouchableOpacity key={cat.id} style={[styles.filterBtn, form.category === cat.id && styles.filterBtnActive]} onPress={() => setForm({ ...form, category: cat.id })}>
                  <Text style={[styles.filterText, form.category === cat.id && styles.filterTextActive]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>الكمية</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor="#CBD5E1" value={form.quantity} onChangeText={(v) => setForm({ ...form, quantity: v })} keyboardType="numeric" textAlign="right" />

            <Text style={styles.inputLabel}>سعر الشراء (ر.س)</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor="#CBD5E1" value={form.price} onChangeText={(v) => setForm({ ...form, price: v })} keyboardType="numeric" textAlign="right" />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FFFFFF", margin: 16, borderRadius: 12,
    paddingHorizontal: 14, borderWidth: 1, borderColor: "#E2E8F0",
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: "#0F172A" },
  filterRow: { marginBottom: 8 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#FFFFFF", marginRight: 8,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  filterBtnActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  filterText: { color: "#64748B", fontSize: 13, fontWeight: "500" },
  filterTextActive: { color: "#FFFFFF", fontWeight: "700" },
  emptyState: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#94A3B8", fontSize: 15 },
  productCard: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16,
    marginBottom: 10, flexDirection: "row",
    borderWidth: 1, borderColor: "#E2E8F0",
    shadowColor: "#0F172A", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  productMain: { flex: 1 },
  productCategoryBadge: { alignSelf: "flex-end", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
  productCategoryText: { fontSize: 11, fontWeight: "600" },
  productName: { fontSize: 15, fontWeight: "700", color: "#0F172A", textAlign: "right", marginBottom: 10 },
  productMeta: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 16 },
  metaItem: { alignItems: "center" },
  metaValue: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  metaLabel: { fontSize: 11, color: "#94A3B8" },
  metaDivider: { width: 1, height: 24, backgroundColor: "#E2E8F0" },
  lowStockBadge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end", marginTop: 8 },
  lowStockText: { fontSize: 11, color: "#DC2626", fontWeight: "600" },
  productActions: { justifyContent: "center", gap: 8, marginLeft: 12 },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center" },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#FEF2F2", justifyContent: "center", alignItems: "center" },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#2563EB", margin: 16,
    borderRadius: 14, padding: 16,
    shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  addBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#475569", textAlign: "right", marginBottom: 6 },
  input: {
    backgroundColor: "#F8FAFC", borderRadius: 12, padding: 14,
    color: "#0F172A", fontSize: 15, marginBottom: 14,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  saveBtn: { flex: 1, backgroundColor: "#2563EB", borderRadius: 12, padding: 14, alignItems: "center" },
  saveBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  cancelBtn: { flex: 1, backgroundColor: "#F1F5F9", borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBtnText: { color: "#64748B", fontSize: 15, fontWeight: "600" },
});