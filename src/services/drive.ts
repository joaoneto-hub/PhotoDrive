import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webContentLink?: string;
  parents?: string[];
}

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webContentLink?: string;
  isFolder: boolean;
  isImage: boolean;
  isVideo: boolean;
  items?: DriveItem[];
}

export interface DriveFolder extends DriveItem {
  items: DriveItem[];
}

class DriveService {
  private async getAccessToken(): Promise<string> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user logged in");
    }

    // Tentar obter o token do localStorage primeiro
    const storedToken = localStorage.getItem("googleAccessToken");
    if (storedToken) {
      return storedToken;
    }

    // Se não houver token armazenado, forçar uma atualização do token
    const token = await user.getIdToken(true);
    localStorage.setItem("googleAccessToken", token);
    localStorage.setItem("accessToken", token);
    return token;
  }

  async getSharedFolderId(): Promise<string> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user logged in");
    }

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      throw new Error("User document not found");
    }

    const userData = userDoc.data();
    const sharedFolderId = userData.sharedFolderId;
    if (!sharedFolderId) {
      throw new Error("No shared folder ID found");
    }

    return sharedFolderId;
  }

  async listAllFiles(folderId?: string): Promise<DriveItem[]> {
    const accessToken = await this.getAccessToken();
    const hasDriveAccess = localStorage.getItem("hasDriveAccess") === "true";

    let query = "https://www.googleapis.com/drive/v3/files?";

    // Se tiver acesso geral, usa a lógica normal
    if (hasDriveAccess) {
      if (folderId) {
        query += `q='${folderId}' in parents and trashed=false&`;
      } else {
        query += "q=trashed=false&";
      }
    }
    // Se não tiver acesso geral, usa a lógica do link compartilhado
    else {
      const sharedFolderId = await this.getSharedFolderId();
      if (!sharedFolderId) {
        throw new Error("Shared folder ID not found");
      }
      query += `q='${sharedFolderId}' in parents and trashed=false&`;
    }

    query +=
      "fields=files(id,name,mimeType,thumbnailLink,webContentLink,parents)&orderBy=name";

    try {
      const response = await fetch(query, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado, tentar renovar
          const newToken = await this.getAccessToken();
          const retryResponse = await fetch(query, {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          });

          if (!retryResponse.ok) {
            throw new Error(
              `Failed to list files after token refresh: ${retryResponse.status} ${retryResponse.statusText}`
            );
          }

          const data = await retryResponse.json();
          return this.mapDriveFiles(data.files);
        }
        throw new Error(
          `Failed to list files: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return this.mapDriveFiles(data.files);
    } catch (error) {
      console.error("Error in listAllFiles:", error);
      throw error;
    }
  }

  private mapDriveFiles(files: GoogleDriveFile[]): DriveItem[] {
    return files.map((file) => ({
      ...file,
      isFolder: file.mimeType === "application/vnd.google-apps.folder",
      isImage: file.mimeType.startsWith("image/"),
      isVideo: file.mimeType.startsWith("video/"),
    }));
  }

  async listFolders(folderId?: string): Promise<DriveItem[]> {
    const accessToken = await this.getAccessToken();
    const hasDriveAccess = localStorage.getItem("hasDriveAccess") === "true";

    let query = "https://www.googleapis.com/drive/v3/files?";

    // Se tiver acesso geral, usa a lógica normal
    if (hasDriveAccess) {
      if (folderId && folderId !== "root") {
        query += `q='${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&`;
      } else {
        query +=
          "q=mimeType='application/vnd.google-apps.folder' and trashed=false&";
      }
    }
    // Se não tiver acesso geral, usa a lógica do link compartilhado
    else {
      const sharedFolderId = await this.getSharedFolderId();
      if (!sharedFolderId) {
        throw new Error("Shared folder ID not found");
      }
      // Se tiver um folderId específico, usa ele, senão usa o sharedFolderId
      const targetFolderId = folderId || sharedFolderId;
      query += `q='${targetFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&`;
    }

    query +=
      "fields=files(id,name,mimeType,thumbnailLink,webContentLink)&orderBy=name";

    try {
      const response = await fetch(query, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado, tentar renovar
          const newToken = await this.getAccessToken();
          const retryResponse = await fetch(query, {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          });

          if (!retryResponse.ok) {
            throw new Error(
              `Failed to list folders after token refresh: ${retryResponse.status} ${retryResponse.statusText}`
            );
          }

          const data = await retryResponse.json();
          return this.mapDriveFiles(data.files);
        }
        throw new Error(
          `Failed to list folders: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return this.mapDriveFiles(data.files);
    } catch (error) {
      console.error("Error in listFolders:", error);
      throw error;
    }
  }

  async getFolderInfo(folderId: string): Promise<DriveFolder> {
    const accessToken = await this.getAccessToken();
    const items = await this.listFolders(folderId);

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado, tentar renovar
        const newToken = await this.getAccessToken();
        const retryResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType`,
          {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          }
        );

        if (!retryResponse.ok) {
          throw new Error("Failed to get folder info after token refresh");
        }

        const folderInfo = await retryResponse.json();
        return {
          ...folderInfo,
          isFolder: true,
          isImage: false,
          isVideo: false,
          items,
        };
      }
      throw new Error("Failed to get folder info");
    }

    const folderInfo = await response.json();
    return {
      ...folderInfo,
      isFolder: true,
      isImage: false,
      isVideo: false,
      items,
    };
  }

  async getFolderPath(folderId: string): Promise<DriveFolder[]> {
    const accessToken = await this.getAccessToken();
    const path: DriveFolder[] = [];

    let currentId = folderId;
    while (currentId) {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${currentId}?fields=id,name,mimeType,parents`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado, tentar renovar
          const newToken = await this.getAccessToken();
          const retryResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${currentId}?fields=id,name,mimeType,parents`,
            {
              headers: {
                Authorization: `Bearer ${newToken}`,
              },
            }
          );

          if (!retryResponse.ok) {
            throw new Error("Failed to get folder path after token refresh");
          }

          const folderInfo = await retryResponse.json();
          path.unshift({
            ...folderInfo,
            isFolder: true,
            isImage: false,
            isVideo: false,
            items: [],
          });

          if (!folderInfo.parents || folderInfo.parents.length === 0) {
            break;
          }

          currentId = folderInfo.parents[0];
          continue;
        }
        throw new Error("Failed to get folder path");
      }

      const folderInfo = await response.json();
      path.unshift({
        ...folderInfo,
        isFolder: true,
        isImage: false,
        isVideo: false,
        items: [],
      });

      if (!folderInfo.parents || folderInfo.parents.length === 0) {
        break;
      }

      currentId = folderInfo.parents[0];
    }

    return path;
  }

  async searchItems(query: string): Promise<DriveItem[]> {
    const accessToken = await this.getAccessToken();
    const hasDriveAccess = localStorage.getItem("hasDriveAccess") === "true";

    let searchQuery = "https://www.googleapis.com/drive/v3/files?";

    // Se tiver acesso geral, usa a lógica normal
    if (hasDriveAccess) {
      searchQuery += `q=name contains '${query}' and trashed=false`;
    }
    // Se não tiver acesso geral, usa a lógica do link compartilhado
    else {
      const sharedFolderId = await this.getSharedFolderId();
      if (!sharedFolderId) {
        throw new Error("Shared folder ID not found");
      }
      searchQuery += `q=name contains '${query}' and '${sharedFolderId}' in parents and trashed=false`;
    }

    searchQuery +=
      "&fields=files(id,name,mimeType,thumbnailLink,webContentLink)&orderBy=name";

    try {
      const response = await fetch(searchQuery, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado, tentar renovar
          const newToken = await this.getAccessToken();
          const retryResponse = await fetch(searchQuery, {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          });

          if (!retryResponse.ok) {
            throw new Error(
              `Failed to search items after token refresh: ${retryResponse.status} ${retryResponse.statusText}`
            );
          }

          const data = await retryResponse.json();
          return this.mapDriveFiles(data.files);
        }
        throw new Error(
          `Failed to search items: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return this.mapDriveFiles(data.files);
    } catch (error) {
      console.error("Error in searchItems:", error);
      throw error;
    }
  }

  async saveSharedFolderId(folderId: string): Promise<void> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user logged in");
    }

    await setDoc(
      doc(db, "users", user.uid),
      {
        sharedFolderId: folderId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    localStorage.setItem("sharedFolderId", folderId);
  }
}

export const driveService = new DriveService();
