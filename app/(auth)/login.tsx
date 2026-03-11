import { useState } from "react";
import { getDoc, doc as firestoreDoc } from "firebase/firestore";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ScrollView, StatusBar
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("خطأ", "يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const userDoc = await getDoc(firestoreDoc(db, "users", uid));
      if (userDoc.exists()) {
        const role = (userDoc.data() as { role: string }).role;
        router.replace(role === "admin" ? "/(tabs)/dashboard" as any : "/(tabs)/orders" as any);
      } else {
        router.replace("/(tabs)/dashboard" as any);
      }
    } catch {
      Alert.alert("خطأ", "البريد الإلكتروني أو كلمة المرور غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Logo Area */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Ionicons name="layers" size={36} color="#2563EB" />
          </View>
          <Text style={styles.appName}>نظام المخزون</Text>
          <Text style={styles.appSubtitle}>إدارة المواد والمشتريات</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>تسجيل الدخول</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>البريد الإلكتروني</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="example@company.com"
                placeholderTextColor="#CBD5E1"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>كلمة المرور</Text>
            <View style={styles.inputWrapper}>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.inputIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#94A3B8" />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#CBD5E1"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textAlign="right"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginBtnText}>{loading ? "جاري الدخول..." : "دخول"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push("/(auth)/register" as any)}
          >
            <Text style={styles.registerLinkText}>ليس لديك حساب؟ <Text style={styles.registerLinkBold}>إنشاء حساب</Text></Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logoArea: { alignItems: "center", marginBottom: 32 },
  logoBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: "#EFF6FF", justifyContent: "center",
    alignItems: "center", marginBottom: 16,
    borderWidth: 1, borderColor: "#BFDBFE",
  },
  appName: { fontSize: 26, fontWeight: "700", color: "#0F172A", letterSpacing: -0.5 },
  appSubtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 20,
    padding: 24, borderWidth: 1, borderColor: "#E2E8F0",
    shadowColor: "#0F172A", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  cardTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A", textAlign: "right", marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", textAlign: "right", marginBottom: 6 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F8FAFC", borderRadius: 12,
    borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 14,
  },
  inputIcon: { padding: 2 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#0F172A", marginHorizontal: 8 },
  loginBtn: {
    backgroundColor: "#2563EB", borderRadius: 12,
    padding: 16, alignItems: "center", marginTop: 8,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  registerLink: { marginTop: 20, alignItems: "center" },
  registerLinkText: { fontSize: 14, color: "#64748B" },
  registerLinkBold: { color: "#2563EB", fontWeight: "600" },
});