import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { useUserData } from "@/hooks/use-user-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings2,
  Shield,
  LinkIcon,
  Save,
  Share2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userData } = useUserData();
  const [accessType, setAccessType] = useState<"full" | "shared">("full");
  const [sharedFolderLink, setSharedFolderLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAccessType, setPendingAccessType] = useState<"full" | "shared">(
    "full"
  );

  useEffect(() => {
    const loadCurrentSettings = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setAccessType(data.accessType || "full");
          if (data.accessType === "shared" && data.sharedFolderId) {
            setSharedFolderLink(
              `https://drive.google.com/drive/folders/${data.sharedFolderId}`
            );
          }
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      }
    };

    loadCurrentSettings();
  }, []);

  const handleAccessTypeChange = (value: "full" | "shared") => {
    if (accessType === "shared" && value === "full") {
      setPendingAccessType(value);
      setShowConfirmDialog(true);
    } else {
      setAccessType(value);
    }
  };

  const handleConfirmAccessChange = () => {
    setAccessType(pendingAccessType);
    setShowConfirmDialog(false);
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado",
          variant: "destructive",
        });
        return;
      }

      const userData = userDoc.data();
      const currentAccessType = userData.accessType || "shared";

      // Se estiver mudando de acesso por link para acesso geral
      if (currentAccessType === "shared" && accessType === "full") {
        // Limpa o sharedFolderId ao mudar para acesso geral
        await updateDoc(userRef, {
          accessType: "full",
          sharedFolderId: null,
          updatedAt: new Date().toISOString(),
        });
        localStorage.setItem("hasDriveAccess", "true");
        toast({
          title: "Sucesso",
          description: "Configurações atualizadas com sucesso",
        });
        navigate("/");
        return;
      }

      // Se estiver mudando para acesso por link
      if (accessType === "shared") {
        if (!sharedFolderLink) {
          toast({
            title: "Erro",
            description: "Link da pasta compartilhada é obrigatório",
            variant: "destructive",
          });
          return;
        }

        const folderIdMatch = sharedFolderLink.match(/folders\/([^?/]+)/);
        if (!folderIdMatch) {
          toast({
            title: "Erro",
            description: "Link da pasta inválido",
            variant: "destructive",
          });
          return;
        }

        const folderId = folderIdMatch[1];
        await updateDoc(userRef, {
          accessType: "shared",
          sharedFolderId: folderId,
          updatedAt: new Date().toISOString(),
        });
        localStorage.setItem("hasDriveAccess", "false");
      }

      toast({
        title: "Sucesso",
        description: "Configurações atualizadas com sucesso",
      });
      navigate("/");
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

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Card Principal */}
          <Card className="flex-1 bg-slate-900 text-white border-slate-800 shadow-xl">
            <CardHeader className="space-y-2 pb-6">
              <div className="flex items-center gap-2">
                <Settings2 className="w-7 h-7 text-blue-400" />
                <CardTitle className="text-2xl sm:text-3xl font-bold">
                  Configurações
                </CardTitle>
              </div>
              <CardDescription className="text-slate-400 flex items-center gap-2 text-base">
                {accessType === "full" ? (
                  <>
                    <Shield className="w-5 h-5 text-blue-400" />
                    Você está usando acesso geral ao Google Drive
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-5 h-5 text-green-400" />
                    Você está usando acesso por link compartilhado
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="accessType"
                      className="text-slate-300 flex items-center gap-2 text-base"
                    >
                      <Settings2 className="w-5 h-5" />
                      Tipo de Acesso
                    </Label>
                    <Select
                      value={accessType}
                      onValueChange={handleAccessTypeChange}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 h-12 text-base">
                        <SelectValue placeholder="Selecione o tipo de acesso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="full"
                          className="flex items-center gap-2 text-base"
                        >
                          <Shield className="w-5 h-5 text-blue-400" />
                          Acesso Geral
                        </SelectItem>
                        <SelectItem
                          value="shared"
                          className="flex items-center gap-2 text-base"
                        >
                          <LinkIcon className="w-5 h-5 text-green-400" />
                          Acesso por Link
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {accessType === "shared" && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label
                          htmlFor="sharedFolderLink"
                          className="text-slate-300 flex items-center gap-2 text-base"
                        >
                          <Share2 className="w-5 h-5" />
                          Link da Pasta Compartilhada
                        </Label>
                        <Input
                          id="sharedFolderLink"
                          value={sharedFolderLink}
                          onChange={(e) => setSharedFolderLink(e.target.value)}
                          placeholder="Cole o link da pasta do Google Drive"
                          className="bg-slate-800 border-slate-700 h-12 text-base"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4 pt-4">
                  <Button
                    variant="outline"
                    className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 h-12 text-base"
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loading className="w-5 h-5" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Salvar Configurações
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Instruções */}
          {accessType === "shared" && (
            <Card className="lg:w-[400px] bg-slate-900 text-white border-slate-800 shadow-xl">
              <CardHeader className="space-y-2 pb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-7 h-7 text-green-400" />
                  <CardTitle className="text-xl sm:text-2xl font-bold">
                    Como Configurar
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <ol className="list-decimal list-inside space-y-4 text-base text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0">1.</span>
                      <span>
                        Acesse o Google Drive e selecione a pasta que deseja
                        compartilhar
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0">2.</span>
                      <span>
                        Clique com o botão direito na pasta e selecione
                        "Compartilhar"
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0">3.</span>
                      <span>
                        Na janela de compartilhamento, clique em "Alterar para
                        qualquer pessoa com o link"
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0">4.</span>
                      <span>Selecione o nível de acesso como "Editor"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0">5.</span>
                      <span>
                        Clique em "Copiar link" e cole no campo ao lado
                      </span>
                    </li>
                  </ol>

                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-slate-400">
                        <p className="font-medium text-slate-300 mb-1">
                          Importante:
                        </p>
                        <p>
                          O link deve ser do tipo "qualquer pessoa com o link" e
                          com permissão de "Editor" para que o sistema funcione
                          corretamente.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-slate-900 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400 text-xl">
              <AlertTriangle className="w-6 h-6" />
              Aviso Importante
            </DialogTitle>
            <DialogDescription className="text-slate-400 space-y-4 text-base">
              <p>
                Ao mudar para acesso geral, você está concedendo ao sistema
                acesso total ao seu Google Drive. Isso significa que:
              </p>
              <ul className="list-disc list-inside space-y-3">
                <li>
                  O sistema poderá acessar todas as suas pastas e arquivos
                </li>
                <li>
                  Você poderá visualizar e gerenciar todo o conteúdo do seu
                  Drive
                </li>
                <li>
                  O sistema terá permissões para listar, visualizar e organizar
                  seus arquivos
                </li>
              </ul>
              <p className="font-medium">
                Você tem certeza que deseja prosseguir com esta mudança?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-11 text-base"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAccessChange}
              className="bg-red-600 hover:bg-red-700 text-white h-11 text-base"
            >
              Confirmar Mudança
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
