import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/firebase";
import PhotoDrive from "../../../public/PhotoDrive.png";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async (withDriveAccess: boolean) => {
    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();

      // Sempre adicionamos os escopos básicos do Drive, independente da escolha
      provider.addScope("https://www.googleapis.com/auth/drive.readonly");
      provider.addScope(
        "https://www.googleapis.com/auth/drive.metadata.readonly"
      );

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        localStorage.setItem("googleAccessToken", credential.accessToken);
        localStorage.setItem("hasDriveAccess", withDriveAccess.toString());

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
      } else {
        toast({
          title: "Erro ao obter token de acesso",
          description: "Por favor, tente novamente.",
          variant: "destructive",
        });
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
