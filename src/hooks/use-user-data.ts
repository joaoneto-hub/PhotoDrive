import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface UserData {
  email: string;
  displayName: string;
  photoURL: string;
  accessType: "full" | "shared";
  createdAt: string;
}

export function useUserData() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      if (!user) {
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          setUserData(data);

          // Atualizar o localStorage com o tipo de acesso
          localStorage.setItem(
            "hasDriveAccess",
            data.accessType === "full" ? "true" : "false"
          );
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [user]);

  return { userData, loading };
}
