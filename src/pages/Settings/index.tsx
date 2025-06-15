import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { driveService } from "@/services/drive";
import { authService } from "@/services/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sharedFolderId, setSharedFolderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [accessType, setAccessType] = useState<"full" | "shared">("shared");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = authService.getCurrentUser();
        if (!user) {
          navigate("/login");
          return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setAccessType(userData.accessType || "shared");
          setSharedFolderId(userData.sharedFolderId || "");
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações",
          variant: "destructive",
        });
      }
    };

    loadSettings();
  }, [navigate, toast]);

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      const user = authService.getCurrentUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Salvar no Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          accessType,
          sharedFolderId: accessType === "shared" ? sharedFolderId : null,
        },
        { merge: true }
      );

      // Atualizar localStorage
      localStorage.setItem(
        "hasDriveAccess",
        accessType === "full" ? "true" : "false"
      );
      if (accessType === "shared") {
        await driveService.saveSharedFolderId(sharedFolderId);
      } else {
        localStorage.removeItem("sharedFolderId");
      }

      toast({
        title: "Configurações salvas",
        description: "Suas configurações foram atualizadas com sucesso",
      });

      navigate("/photos");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 text-white">Configurações</h1>
          <p className="text-muted-foreground">
            Configure como deseja acessar suas fotos
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <Button
              className="w-full"
              variant={accessType === "full" ? "default" : "outline"}
              onClick={() => setAccessType("full")}
            >
              Acessar todo o Drive
            </Button>

            <Button
              className="w-full"
              variant={accessType === "shared" ? "default" : "outline"}
              onClick={() => setAccessType("shared")}
            >
              Acessar via link compartilhado
            </Button>
          </div>

          {accessType === "shared" && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                ID da pasta compartilhada
              </label>
              <Input
                value={sharedFolderId}
                onChange={(e) => setSharedFolderId(e.target.value)}
                placeholder="Cole o ID da pasta compartilhada aqui"
              />
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSaveSettings}
            disabled={isLoading || (accessType === "shared" && !sharedFolderId)}
          >
            Salvar configurações
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
