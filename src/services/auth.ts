import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

class AuthService {
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();

    // Adicionar todos os escopos necessários do Drive
    provider.addScope("https://www.googleapis.com/auth/drive.readonly");
    provider.addScope("https://www.googleapis.com/auth/drive.metadata.readonly");
    provider.addScope("https://www.googleapis.com/auth/drive.file");
    provider.addScope("https://www.googleapis.com/auth/drive.photos.readonly");

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (credential?.accessToken) {
      // Salvar o token de acesso para ambos os tipos de acesso
      localStorage.setItem("googleAccessToken", credential.accessToken);
      localStorage.setItem("accessToken", credential.accessToken);
      return result.user;
    }

    throw new Error("Failed to get access token");
  }

  async logout() {
    await auth.signOut();
    localStorage.removeItem("googleAccessToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("hasDriveAccess");
  }

  getCurrentUser() {
    return auth.currentUser;
  }
}

export const authService = new AuthService(); 