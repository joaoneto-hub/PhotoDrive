import type { Photo, Folder } from "@/types/photo";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { DRIVE_API_BASE_URL } from "@/config/constants";

interface DriveFile {
  id: string;
  name: string;
  mimeType?: string;
  parents?: string[];
}

export const driveService = {
  async listFolders(parentFolderId?: string): Promise<Array<Photo | Folder>> {
    try {
      const token = localStorage.getItem("googleAccessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      // Se não foi especificada uma pasta pai, usar a pasta compartilhada
      if (!parentFolderId) {
        parentFolderId = await this.getSharedFolderId();
      }

      // Buscar todos os arquivos e pastas
      const response = await fetch(
        `${DRIVE_API_BASE_URL}/files?q=${encodeURIComponent(
          `'${parentFolderId}' in parents and trashed=false`
        )}&fields=files(id,name,mimeType)&orderBy=name`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const data = await response.json();
      console.log("Files response:", data);

      // Transformar os arquivos retornados no formato correto
      const files = (data.files || []).map((file: DriveFile) => {
        if (file.mimeType === "application/vnd.google-apps.folder") {
          return {
            id: file.id,
            name: file.name,
          } as Folder;
        } else {
          return {
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
          } as Photo;
        }
      });

      // Ordenar os arquivos: pastas primeiro, depois arquivos
      files.sort((a: Photo | Folder, b: Photo | Folder) => {
        const aIsFolder = !("mimeType" in a);
        const bIsFolder = !("mimeType" in b);
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return a.name.localeCompare(b.name);
      });

      return files;
    } catch (error) {
      console.error("Error listing folders:", error);
      throw error;
    }
  },

  async listPhotos(folderId: string): Promise<Photo[]> {
    try {
      const token = localStorage.getItem("googleAccessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      console.log("Listing photos for folder:", folderId);
      console.log("Access token present:", !!token);

      // Verificar se o usuário tem acesso à pasta
      const hasFullAccess = localStorage.getItem("hasFullAccess") === "true";
      const sharedFolderId = await this.getSharedFolderId();

      console.log("Access info:", {
        hasFullAccess,
        sharedFolderId,
        folderId,
      });

      // Se não tem acesso total, verificar se a pasta está na pasta compartilhada
      if (!hasFullAccess && sharedFolderId) {
        // Se estamos listando a pasta compartilhada, não precisamos verificar
        if (folderId === sharedFolderId) {
          console.log("Listing shared folder contents");
        } else {
          try {
            const folderResponse = await fetch(
              `${DRIVE_API_BASE_URL}/files/${folderId}?fields=parents`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!folderResponse.ok) {
              throw new Error("Failed to verify folder access");
            }

            const folderData = await folderResponse.json();
            console.log("Folder parents:", folderData.parents);

            // Verificar se a pasta está dentro da pasta compartilhada
            const isInSharedFolder =
              folderData.parents?.includes(sharedFolderId);
            if (!isInSharedFolder) {
              throw new Error("Folder not in shared folder");
            }
          } catch (error) {
            console.error("Error verifying folder access:", error);
            throw new Error("Folder not accessible");
          }
        }
      }

      // Construir a query para buscar fotos e vídeos
      const mimeTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ];
      const mimeTypeQuery = mimeTypes
        .map((type) => `mimeType='${type}'`)
        .join(" or ");
      const query = `(${mimeTypeQuery}) and '${folderId}' in parents and trashed=false`;

      console.log("Query for media:", query);

      // Buscar as fotos e vídeos
      const response = await fetch(
        `${DRIVE_API_BASE_URL}/files?q=${encodeURIComponent(
          query
        )}&fields=files(id,name,mimeType)&orderBy=name`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch media");
      }

      const data = await response.json();
      console.log("Media response:", data);

      return data.files || [];
    } catch (error) {
      console.error("Error listing photos:", error);
      throw error;
    }
  },

  async getPhotoUrl(photoId: string): Promise<string> {
    try {
      const token = localStorage.getItem("googleAccessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      console.log("Getting photo URL for:", photoId);
      console.log("Access token present:", !!token);

      // Verificar se o usuário tem acesso à foto
      const hasFullAccess = localStorage.getItem("hasFullAccess") === "true";
      const sharedFolderId = await this.getSharedFolderId();

      console.log("Access info:", {
        hasFullAccess,
        sharedFolderId,
        photoId,
      });

      // Se não tem acesso total, verificar se a foto está na pasta compartilhada
      if (!hasFullAccess && sharedFolderId) {
        try {
          const photoResponse = await fetch(
            `${DRIVE_API_BASE_URL}/files/${photoId}?fields=parents`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!photoResponse.ok) {
            throw new Error("Failed to verify photo access");
          }

          const photoData = await photoResponse.json();
          console.log("Photo parents:", photoData.parents);

          // Verificar se a foto está na pasta compartilhada ou em uma subpasta
          const isInSharedFolder = photoData.parents?.includes(sharedFolderId);
          if (!isInSharedFolder) {
            throw new Error("Photo not in shared folder");
          }
        } catch (error) {
          console.error("Error verifying photo access:", error);
          throw new Error("Photo not accessible");
        }
      }

      // Buscar a URL da foto
      const response = await fetch(
        `${DRIVE_API_BASE_URL}/files/${photoId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch photo");
      }

      // Converter a resposta para blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      console.log("Created photo URL:", url);
      return url;
    } catch (error) {
      console.error("Error getting photo URL:", error);
      throw error;
    }
  },

  async saveSharedFolderId(folderId: string): Promise<void> {
    // Remove o parâmetro ?usp=sharing se existir
    const cleanFolderId = folderId.split("?")[0];
    localStorage.setItem("sharedFolderId", cleanFolderId);
  },

  async removeSharedFolderId(): Promise<void> {
    localStorage.removeItem("sharedFolderId");
  },

  async getSharedFolderId(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user logged in");
    }

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      console.log("No user document found");
      throw new Error("No user document found");
    }

    const sharedFolderId = userDoc.data().sharedFolderId;
    if (!sharedFolderId) {
      throw new Error("No shared folder ID found");
    }

    console.log("Shared folder ID:", sharedFolderId);
    return sharedFolderId.split("?")[0]; // Remove o parâmetro ?usp=sharing se existir
  },

  async getFolderPath(folderId: string): Promise<Folder[]> {
    try {
      const token = localStorage.getItem("googleAccessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      const sharedFolderId = await this.getSharedFolderId();
      const path: Folder[] = [];

      let currentId = folderId.split("?")[0]; // Limpa o ID da pasta
      while (currentId && currentId !== sharedFolderId) {
        const response = await fetch(
          `${DRIVE_API_BASE_URL}/files/${currentId}?fields=id,name,parents`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch folder info");
        }

        const folder = await response.json();
        path.unshift({
          id: folder.id,
          name: folder.name,
        });

        currentId = folder.parents?.[0];
      }

      return path;
    } catch (error) {
      console.error("Error getting folder path:", error);
      throw error;
    }
  },

  async listAllFiles(folderId: string): Promise<Array<Photo | Folder>> {
    return this.listFolders(folderId);
  },

  async getFolderInfo(folderId: string): Promise<Folder> {
    try {
      const token = localStorage.getItem("googleAccessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      const response = await fetch(
        `${DRIVE_API_BASE_URL}/files/${folderId}?fields=id,name`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch folder info");
      }

      const data = await response.json();
      return {
        id: data.id,
        name: data.name,
      };
    } catch (error) {
      console.error("Error getting folder info:", error);
      throw error;
    }
  },

  getFileUrl(fileId: string): string {
    const token = localStorage.getItem("googleAccessToken");
    if (!token) {
      throw new Error("No access token found");
    }
    return `${DRIVE_API_BASE_URL}/files/${fileId}?alt=media&access_token=${encodeURIComponent(
      token
    )}`;
  },
};
