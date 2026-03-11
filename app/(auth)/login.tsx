import { useState } from "react";
import { getDoc, doc as firestoreDoc } from "firebase/firestore";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  I18nManager,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { router } from "expo-router";

I18nManager.forceRTL(true);

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("خطأ", "يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;
      const userDoc = await getDoc(firestoreDoc(db, "users", uid));

      if (userDoc.exists()) {
        const role = (userDoc.data() as { role: string }).role;
        if (role === "admin") {
          router.replace("/(tabs)/dashboard" as any);
        } else {
          router.replace("/(tabs)/orders" as any);
        }
      } else {
        router.replace("/(tabs)/dashboard" as any);
      }
    } catch (error) {
      Alert.alert("خطأ", "البريد الإلكتروني أو كلمة المرور غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

 return (
   <KeyboardAvoidingView
     style={styles.container}
     behavior={Platform.OS === "ios" ? "padding" : undefined}
   >
     <Text style={styles.title}>نظام إدارة المخزون</Text>
     <Text style={styles.subtitle}>تسجيل الدخول</Text>

     <TextInput
       style={styles.input}
       placeholder="البريد الإلكتروني"
       placeholderTextColor="#999"
       value={email}
       onChangeText={setEmail}
       keyboardType="email-address"
       autoCapitalize="none"
       textAlign="right"
     />

     <TextInput
       style={styles.input}
       placeholder="كلمة المرور"
       placeholderTextColor="#999"
       value={password}
       onChangeText={setPassword}
       secureTextEntry
       textAlign="right"
     />

     <TouchableOpacity
       style={[styles.button, loading && styles.buttonDisabled]}
       onPress={handleLogin}
       disabled={loading}
     >
       <Text style={styles.buttonText}>
         {loading ? "جاري الدخول..." : "دخول"}
       </Text>
     </TouchableOpacity>

     <TouchableOpacity
       style={styles.registerLink}
       onPress={() => router.push("/(auth)/register" as any)}
     >
       <Text style={styles.registerLinkText}>
         ليس لديك حساب؟ إنشاء حساب جديد
       </Text>
     </TouchableOpacity>
   </KeyboardAvoidingView>
 );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
  registerLink: { marginTop: 20, alignItems: "center" },
  registerLinkText: { color: "#3b82f6", fontSize: 15 },
});
