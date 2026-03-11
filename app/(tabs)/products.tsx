import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator, ScrollView
} from "react-native";
import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, query, where
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

const CATEGORIES = [
  { id: "all", label: "الكل" },
  { id: "plumbing", label: "السباكة" },
  { id: "electrical", label: "الكهرباء" },
  { id: "smart", label: "الأنظمة الذكية" },
];

type Product = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
};

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

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [search, selectedCategory, products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
      setProducts(data);
    } catch (e) {
      Alert.alert("خطأ", "فشل تحميل المنتجات");
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let result = [...products];
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (search.trim()) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      quantity: String(product.quantity),
      price: String(product.price),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.quantity || !form.price) {
      Alert.alert("خطأ", "يرجى ملء جميع الحقول");
      return;
    }
    const data = {
      name: form.name,
      category: form.category,
      quantity: Number(form.quantity),
      price: Number(form.price),
      image: "",
    };
    try {
      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), data);
      } else {
        await addDoc(collection(db, "products"), data);
      }
      setModalVisible(false);
      fetchProducts();
    } catch (e) {
      Alert.alert("خطأ", "فشل حفظ المنتج");
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert("حذف المنتج", `هل تريد حذف "${product.name}"؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "products", product.id));
          fetchProducts();
        },
      },
    ]);
  };

  const getCategoryLabel = (id: string) =>
    CATEGORIES.find((c) => c.id === id)?.label || id;

  return (
    <View style={styles.container}>
      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="ابحث عن منتج..."
        placeholderTextColor="#64748b"
        value={search}
        onChangeText={setSearch}
        textAlign="right"
      />

      {/* Category Filter */}
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

      {/* Product List */}
      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>لا توجد منتجات</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productCategory}>{getCategoryLabel(item.category)}</Text>
                <View style={styles.productDetails}>
                  <Text style={styles.productDetail}>الكمية: {item.quantity}</Text>
                  <Text style={styles.productDetail}>السعر: {item.price} ر.س</Text>
                </View>
                {item.quantity <= 5 && (
                  <Text style={styles.lowStock}>⚠️ مخزون منخفض</Text>
                )}
              </View>
              <View style={styles.productActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.editBtn]}
                  onPress={() => openEditModal(item)}
                >
                  <Text style={styles.actionBtnText}>تعديل</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDelete(item)}
                >
                  <Text style={styles.actionBtnText}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
        <Text style={styles.addBtnText}>+ إضافة منتج</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="اسم المنتج"
              placeholderTextColor="#64748b"
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              textAlign="right"
            />

            <Text style={styles.inputLabel}>الفئة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.filterBtn, form.category === cat.id && styles.filterBtnActive]}
                  onPress={() => setForm({ ...form, category: cat.id })}
                >
                  <Text style={[styles.filterText, form.category === cat.id && styles.filterTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.input}
              placeholder="الكمية"
              placeholderTextColor="#64748b"
              value={form.quantity}
              onChangeText={(v) => setForm({ ...form, quantity: v })}
              keyboardType="numeric"
              textAlign="right"
            />

            <TextInput
              style={styles.input}
              placeholder="سعر الشراء"
              placeholderTextColor="#64748b"
              value={form.price}
              onChangeText={(v) => setForm({ ...form, price: v })}
              keyboardType="numeric"
              textAlign="right"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
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
  container: { flex: 1, backgroundColor: "#0f172a" },
  searchInput: {
    backgroundColor: "#1e293b", margin: 16, borderRadius: 12,
    padding: 14, color: "#fff", fontSize: 15, borderWidth: 1, borderColor: "#334155",
  },
  filterRow: { paddingHorizontal: 16, marginBottom: 8 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#1e293b", marginRight: 8, borderWidth: 1, borderColor: "#334155",
  },
  filterBtnActive: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  filterText: { color: "#94a3b8", fontSize: 14 },
  filterTextActive: { color: "#fff", fontWeight: "bold" },
  emptyText: { color: "#64748b", textAlign: "center", marginTop: 40, fontSize: 16 },
  productCard: {
    backgroundColor: "#1e293b", borderRadius: 12, padding: 16,
    marginBottom: 12, flexDirection: "row", justifyContent: "space-between",
  },
  productInfo: { flex: 1 },
  productName: { color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "right" },
  productCategory: { color: "#3b82f6", fontSize: 13, textAlign: "right", marginTop: 2 },
  productDetails: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8, gap: 12 },
  productDetail: { color: "#94a3b8", fontSize: 13 },
  lowStock: { color: "#ef4444", fontSize: 12, textAlign: "right", marginTop: 6 },
  productActions: { justifyContent: "center", gap: 8, marginLeft: 12 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editBtn: { backgroundColor: "#3b82f6" },
  deleteBtn: { backgroundColor: "#ef4444" },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  addBtn: {
    backgroundColor: "#3b82f6", margin: 16, borderRadius: 12,
    padding: 16, alignItems: "center",
  },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1e293b", borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24,
  },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", textAlign: "right", marginBottom: 20 },
  inputLabel: { color: "#94a3b8", fontSize: 14, textAlign: "right", marginBottom: 8 },
  input: {
    backgroundColor: "#0f172a", borderRadius: 12, padding: 14,
    color: "#fff", fontSize: 15, marginBottom: 12,
    borderWidth: 1, borderColor: "#334155",
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  saveBtn: { flex: 1, backgroundColor: "#3b82f6", borderRadius: 12, padding: 14, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cancelBtn: { flex: 1, backgroundColor: "#334155", borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBtnText: { color: "#fff", fontSize: 16 },
});