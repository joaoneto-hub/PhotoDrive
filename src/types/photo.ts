export interface Photo {
  id: string;
  name: string;
  mimeType: string;
  url?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webContentLink: string;
  parents?: string[];
}

export interface Folder {
  id: string;
  name: string;
}
