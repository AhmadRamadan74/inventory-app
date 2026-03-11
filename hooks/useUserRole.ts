import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebaseConfig";

export function useUserRole() {
  const [role, setRole] = useState<"admin" | "engineer" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          setRole(docSnap.data().role);
          setUserName(docSnap.data().name);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return { role, userId, userName, loading };
}
