import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator, ScrollView
} from "react-native";
import {
  collection, getDocs, addDoc, doc, updateDoc, Timestamp
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

type Product = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
};

type Purchase = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  supplier: string;
  date: string;
  createdAt: any;
};

const EMPTY_FORM = {
  productId: "",
  productName: "",
  quantity: "",
  price: "",
  supplier: "",
  date: "",
};

export default function PurchasesScreen() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [purchasesSnap, productsSnap] = await Promise.all([
        getDocs(collection(db, "purchases")),
        getDocs(collection(db, "products")),
      ]);
      const purchasesData = purchasesSnap.docs.map((d) => ({
        id: d.id, ...d.data()
      } as Purchase));
      purchasesData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setPurchases(purchasesData);
      setProducts(productsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
    } catch (e) {
      Alert.alert("خطأ", "فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.productId || !form.quantity || !form.price || !form.supplier || !form.date) {
      Alert.alert("خطأ", "يرجى ملء جميع الحقول");
      return;
    }
    setSaving(true);
    try {
      // Add purchase record
      await addDoc(collection(db, "purchases"), {
        productId: form.productId,
        productName: form.productName,
        quantity: Number(form.quantity),
        price: Number(form.price),
        supplier: form.supplier,
        date: form.date,
        createdAt: Timestamp.now(),
      });

      // Reduce product quantity
      const product = products.find((p) => p.id === form.productId);
      if (product) {
        const newQty = product.quantity - Number(form.quantity);
        await updateDoc(doc(db, "products", form.productId), {
          quantity: newQty < 0 ? 0 : newQty,
        });
      }

      setModalVisible(false);
      setForm(EMPTY_FORM);
      fetchAll();
      Alert.alert("تم", "تم تسجيل الشراء وتحديث المخزون");
    } catch (e) {
      Alert.alert("خطأ", "فشل حفظ الشراء");
    } finally {
      setSaving(false);
    }
  };

  const selectProduct = (product: Product) => {
    setForm({
      ...form,
      productId: product.id,
      productName: product.name,
      price: String(product.price),
    });
    setProductModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={purchases}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>لا توجد مشتريات مسجلة</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.purchaseCard}>
              <Text style={styles.purchaseName}>{item.productName}</Text>
              <View style={styles.purchaseRow}>
                <Text style={styles.purchaseDetail}>المورد: {item.supplier}</Text>
                <Text style={styles.purchaseDetail}>التاريخ: {item.date}</Text>
              </View>
              <View style={styles.purchaseRow}>
                <Text style={styles.purchaseDetail}>الكمية: {item.quantity}</Text>
                <Text style={styles.purchaseDetail}>السعر: {item.price} ر.س</Text>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.addBtnText}>+ تسجيل شراء جديد</Text>
      </TouchableOpacity>

      {/* Add Purchase Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>تسجيل شراء جديد</Text>

              {/* Product Selector */}
              <Text style={styles.inputLabel}>المنتج</Text>
              <TouchableOpacity
                style={styles.productSelector}
                onPress={() => setProductModalVisible(true)}
              >
                <Text style={form.productId ? styles.productSelectorText : styles.productSelectorPlaceholder}>
                  {form.productName || "اختر منتجاً..."}
                </Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>الكمية المشتراة</Text>
              <TextInput
                style={styles.input}
                placeholder="الكمية"
                placeholderTextColor="#64748b"
                value={form.quantity}
                onChangeText={(v) => setForm({ ...form, quantity: v })}
                keyboardType="numeric"
                textAlign="right"
              />

              <Text style={styles.inputLabel}>السعر</Text>
              <TextInput
                style={styles.input}
                placeholder="السعر"
                placeholderTextColor="#64748b"
                value={form.price}
                onChangeText={(v) => setForm({ ...form, price: v })}
                keyboardType="numeric"
                textAlign="right"
              />

              <Text style={styles.inputLabel}>اسم المورد</Text>
              <TextInput
                style={styles.input}
                placeholder="اسم المورد"
                placeholderTextColor="#64748b"
                value={form.supplier}
                onChangeText={(v) => setForm({ ...form, supplier: v })}
                textAlign="right"
              />

              <Text style={styles.inputLabel}>تاريخ الشراء</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: 2026-03-09"
                placeholderTextColor="#64748b"
                value={form.date}
                onChangeText={(v) => setForm({ ...form, date: v })}
                textAlign="right"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnText}>{saving ? "جاري الحفظ..." : "حفظ"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setModalVisible(false); setForm(EMPTY_FORM); }}
                >
                  <Text style={styles.cancelBtnText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Product Picker Modal */}
      <Modal visible={productModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>اختر منتجاً</Text>
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productItem}
                  onPress={() => selectProduct(item)}
                >
                  <Text style={styles.productItemName}>{item.name}</Text>
                  <Text style={styles.productItemQty}>المتاح: {item.quantity}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setProductModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  emptyText: { color: "#64748b", textAlign: "center", marginTop: 40, fontSize: 16 },
  purchaseCard: {
    backgroundColor: "#1e293b", borderRadius: 12,
    padding: 16, marginBottom: 12,
  },
  purchaseName: { color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "right", marginBottom: 8 },
  purchaseRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  purchaseDetail: { color: "#94a3b8", fontSize: 13 },
  addBtn: {
    backgroundColor: "#3b82f6", margin: 16,
    borderRadius: 12, padding: 16, alignItems: "center",
  },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#1e293b", borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24,
  },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", textAlign: "right", marginBottom: 20 },
  inputLabel: { color: "#94a3b8", fontSize: 14, textAlign: "right", marginBottom: 6 },
  input: {
    backgroundColor: "#0f172a", borderRadius: 12, padding: 14,
    color: "#fff", fontSize: 15, marginBottom: 12,
    borderWidth: 1, borderColor: "#334155",
  },
  productSelector: {
    backgroundColor: "#0f172a", borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: "#334155",
  },
  productSelectorText: { color: "#fff", fontSize: 15, textAlign: "right" },
  productSelectorPlaceholder: { color: "#64748b", fontSize: 15, textAlign: "right" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  saveBtn: { flex: 1, backgroundColor: "#3b82f6", borderRadius: 12, padding: 14, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cancelBtn: { flex: 1, backgroundColor: "#334155", borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBtnText: { color: "#fff", fontSize: 16, textAlign: "center" },
  productItem: {
    padding: 16, borderBottomWidth: 1, borderBottomColor: "#0f172a",
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  productItemName: { color: "#fff", fontSize: 15 },
  productItemQty: { color: "#64748b", fontSize: 13 },
});