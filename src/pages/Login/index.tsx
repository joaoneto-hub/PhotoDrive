import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authService } from "@/services/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PhotoDrive from "../../../public/PhotoDrive.png";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import type { User } from "firebase/auth";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useUserData } from "@/hooks/use-user-data";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { userData } = useUserData();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user && userData) {
        // Se o usuário tem acesso completo, redireciona para a página inicial
        if (userData.accessType === "full") {
          navigate("/");
        } else {
          // Se o usuário tem acesso compartilhado, redireciona para as configurações
          navigate("/settings");
        }
      }
    });
    return () => unsubscribe();
  }, [navigate, userData]);

  const handleGoogleLogin = async (withDriveAccess: boolean) => {
    try {
      setIsLoading(true);
      const user = await authService.loginWithGoogle();

      if (user) {
        // Verificar se é a primeira vez que o usuário faz login
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          // Se for a primeira vez, salvar todas as informações do usuário
          await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            accessType: withDriveAccess ? "full" : "shared",
            sharedFolderId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          localStorage.setItem("hasDriveAccess", withDriveAccess.toString());
        } else {
          // Se não for a primeira vez, verificar o tipo de acesso atual
          const userData = userDoc.data();
          const currentAccessType = userData.accessType || "shared";

          // Se o tipo de acesso escolhido for diferente do atual
          if (currentAccessType !== (withDriveAccess ? "full" : "shared")) {
            // Fazer logout para permitir nova escolha
            await authService.logout();

            toast({
              title: "Tipo de acesso incompatível",
              description: `Você já possui uma conta com acesso ${
                currentAccessType === "full" ? "geral" : "por link"
              }. Por favor, faça login novamente escolhendo o tipo de acesso correto.`,
              variant: "destructive",
            });
            return;
          }

          // Se o tipo de acesso for o mesmo, apenas atualiza o localStorage
          localStorage.setItem("hasDriveAccess", withDriveAccess.toString());
        }

        toast({
          title: "Login realizado com sucesso",
          description: withDriveAccess
            ? "Você será redirecionado em instantes..."
            : "Por favor, configure sua pasta compartilhada nas configurações.",
        });

        // Se o usuário escolheu usar pasta compartilhada, redireciona para as configurações
        if (!withDriveAccess) {
          navigate("/settings");
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro ao tentar fazer login com o Google.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm bg-black text-white border-0 shadow-lg">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <img
              src={PhotoDrive}
              alt="Logo"
              className="w-24 h-24 object-contain"
            />
          </div>
          <CardTitle className="text-center">
            Faça login no PhotoDrive
          </CardTitle>
          <CardDescription className="text-slate-300 text-center">
            Bem-vindo(a) de volta à sua galeria!
          </CardDescription>
          <CardAction></CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="text-sm text-slate-400 text-center mb-2">
              Escolha como deseja acessar suas fotos:
            </div>
            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="w-full bg-black border-slate-700 text-white cursor-pointer transition-colors"
                onClick={() => handleGoogleLogin(true)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loading className="w-5 h-5" />
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Acessar todo o Drive
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full bg-black border-slate-700 text-white cursor-pointer transition-colors"
                onClick={() => handleGoogleLogin(false)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loading className="w-5 h-5" />
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Usar pasta compartilhada
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
