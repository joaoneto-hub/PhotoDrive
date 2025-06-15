import { auth } from "@/lib/firebase";
import { DRIVE_API_BASE_URL } from "@/config/constants";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface DriveFile {
  id: string;
  name: string;
  mimeType?: string;
  parents?: string[];
  thumbnailLink?: string;
  webContentLink?: string;
}

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  parentId: string;
  thumbnailLink: string;
  webContentLink: string;
  isFolder: boolean;
  isImage: boolean;
  isVideo: boolean;
}

interface DriveFolder {
  id: string;
  name: string;
  parentId?: string;
}

interface DriveResponse {
  files: DriveFile[];
}

export const driveService = {
  async getFolderPath(folderId: string): Promise<DriveFolder[]> {
    const path: DriveFolder[] = [];
    let currentId = folderId;

    while (currentId) {
      const folder = await this.getFolderInfo(currentId);
      path.unshift(folder);
      currentId = folder.parentId || "";
    }

    return path;
  },

  async listFolders(folderId: string = "root"): Promise<DriveItem[]> {
    try {
      const hasFullAccess = localStorage.getItem("hasDriveAccess") === "true";
      const accessToken = hasFullAccess
        ? await this.getAccessToken()
        : await this.getSharedAccessToken();

      if (!accessToken) {
        throw new Error("No access token available");
      }

      const targetFolderId = hasFullAccess
        ? folderId
        : folderId === "root"
        ? await this.getSharedFolderId()
        : folderId;

      if (!targetFolderId) {
        throw new Error("No folder ID available");
      }

      console.log("Listing folders with token:", accessToken);
      console.log("Target folder ID:", targetFolderId);

      const query = `'${targetFolderId}' in parents and trashed=false`;
      console.log("Query:", query);

      const response = await fetch(
        `${DRIVE_API_BASE_URL}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,parents,thumbnailLink,webContentLink)&spaces=drive&pageSize=1000&orderBy=name`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as DriveResponse;
      console.log("Drive API response:", data);

      if (!data.files || !Array.isArray(data.files)) {
        console.log("No files found in response");
        return [];
      }

      return data.files.map((file: DriveFile) => {
        const isFolder = file.mimeType === "application/vnd.google-apps.folder";
        const isImage = file.mimeType?.startsWith("image/") || false;
        const isVideo = file.mimeType?.startsWith("video/") || false;

        console.log("Processing file:", {
          name: file.name,
          mimeType: file.mimeType,
          isFolder,
          isImage,
          isVideo,
        });

        return {
          id: file.id || "",
          name: file.name || "",
          mimeType: file.mimeType || "",
          parentId: file.parents?.[0] || "",
          thumbnailLink: file.thumbnailLink || "",
          webContentLink: file.webContentLink || "",
          isFolder,
          isImage,
          isVideo,
        };
      });
    } catch (error) {
      console.error("Error listing folders:", error);
      throw error;
    }
  },

  async getAccessToken(): Promise<string> {
    const token = localStorage.getItem("googleAccessToken");
    if (!token) {
      throw new Error("No access token found");
    }
    return token;
  },

  async getSharedAccessToken(): Promise<string> {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("googleAccessToken");
    if (!token) {
      throw new Error("No access token found");
    }
    return token;
  },

  async getFolderInfo(folderId: string): Promise<DriveFolder> {
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(
        `${DRIVE_API_BASE_URL}/files/${folderId}?fields=id,name,parents`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch folder info: ${response.status} ${response.statusText}`);
      }

      const folder = await response.json();
      return {
        id: folder.id,
        name: folder.name,
        parentId: folder.parents?.[0],
      };
    } catch (error) {
      console.error("Error getting folder info:", error);
      throw error;
    }
  },

  async saveSharedFolderId(folderId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No user logged in");
      }

      // Limpar o ID da pasta
      const cleanFolderId = folderId.split("/").pop()?.split("?")[0];
      if (!cleanFolderId) {
        throw new Error("Invalid folder ID format");
      }

      // Salvar no Firestore
      await setDoc(doc(db, "users", user.uid), {
        sharedFolderId: cleanFolderId,
      });

      // Salvar no localStorage
      localStorage.setItem("sharedFolderId", cleanFolderId);
      console.log("Saved shared folder ID:", cleanFolderId);
    } catch (error) {
      console.error("Error saving shared folder ID:", error);
      throw error;
    }
  },

  async removeSharedFolderId(): Promise<void> {
    localStorage.removeItem("sharedFolderId");
  },

  async getSharedFolderId(): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No user logged in");
      }

      // Tentar obter do localStorage primeiro
      const localFolderId = localStorage.getItem("sharedFolderId");
      if (localFolderId) {
        return localFolderId;
      }

      // Se não estiver no localStorage, tentar obter do Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.sharedFolderId) {
          // Salvar no localStorage para futuras consultas
          localStorage.setItem("sharedFolderId", data.sharedFolderId);
          return data.sharedFolderId;
        }
      }

      throw new Error("No shared folder ID found");
    } catch (error) {
      console.error("Error getting shared folder ID:", error);
      throw error;
    }
  },
};
