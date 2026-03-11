import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { router } from "expo-router";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) {
      Alert.alert("خطأ", "يرجى ملء جميع الحقول");
      return;
    }
    if (password !== confirm) {
      Alert.alert("خطأ", "كلمتا المرور غير متطابقتين");
      return;
    }
    if (password.length < 6) {
      Alert.alert("خطأ", "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        name,
        email,
        role: "engineer",
      });

      Alert.alert("تم", "تم إنشاء الحساب بنجاح", [
        {
          text: "حسناً",
          onPress: () => router.replace("/(tabs)/orders" as any),
        },
      ]);
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("خطأ", "البريد الإلكتروني مستخدم مسبقاً");
      } else {
        Alert.alert("خطأ", "فشل إنشاء الحساب");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>إنشاء حساب جديد</Text>
        <Text style={styles.subtitle}>للمهندسين فقط</Text>

        <TextInput
          style={styles.input}
          placeholder="الاسم الكامل"
          placeholderTextColor="#64748b"
          value={name}
          onChangeText={setName}
          textAlign="right"
        />

        <TextInput
          style={styles.input}
          placeholder="البريد الإلكتروني"
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          textAlign="right"
        />

        <TextInput
          style={styles.input}
          placeholder="كلمة المرور"
          placeholderTextColor="#64748b"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textAlign="right"
        />

        <TextInput
          style={styles.input}
          placeholder="تأكيد كلمة المرور"
          placeholderTextColor="#64748b"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          textAlign="right"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "جاري الإنشاء..." : "إنشاء حساب"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.back()}
        >
          <Text style={styles.loginLinkText}>لديك حساب؟ تسجيل الدخول</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 24, justifyContent: "center", flexGrow: 1 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  button: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  loginLink: { marginTop: 20, alignItems: "center" },
  loginLinkText: { color: "#3b82f6", fontSize: 15 },
});
