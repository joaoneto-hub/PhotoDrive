import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { driveService } from "@/services/drive";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CreateFolderModal } from "@/components/CreateFolderModal";
import { UploadModal } from "@/components/UploadModal";
import {
  Folder,
  Image,
  Video,
  ArrowLeft,
  Filter,
  ChevronDown,
  Search,
  Upload,
  Plus,
  FolderOpen,
  X,
} from "lucide-react";

interface File {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  size?: string;
  createdTime?: string;
}

interface Folder {
  id: string;
  name: string;
}

const Photos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>("root");
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [filterType, setFilterType] = useState<
    "all" | "images" | "videos" | "folders"
  >("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSharedFolder, setIsSharedFolder] = useState(false);
  const [sharedFolderId, setSharedFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Verifica se é um acesso via link compartilhado
    const searchParams = new URLSearchParams(location.search);
    const folderId = searchParams.get("folder");
    const hasDriveAccess = localStorage.getItem("hasDriveAccess") === "true";

    if (folderId) {
      // Se for um link compartilhado específico
      setIsSharedFolder(true);
      setSharedFolderId(folderId);
      setCurrentFolder(folderId);
      fetchSharedFolderInfo(folderId);
    } else if (!hasDriveAccess) {
      // Se não tiver acesso geral, busca o ID da pasta compartilhada
      driveService
        .getSharedFolderId()
        .then((id) => {
          setIsSharedFolder(true);
          setSharedFolderId(id);
          setCurrentFolder(id);
          fetchSharedFolderInfo(id);
        })
        .catch(() => {
          navigate("/");
        });
    } else {
      // Acesso normal ao drive
      setIsSharedFolder(false);
      setSharedFolderId(null);
      setCurrentFolder("root");
      fetchFiles();
    }
  }, [user, location.search]);

  const fetchSharedFolderInfo = async (folderId: string) => {
    try {
      setIsLoading(true);
      const folderInfo = await driveService.getFolderInfo(folderId);
      if (folderInfo) {
        setFolderPath([{ id: folderId, name: folderInfo.name }]);
        fetchFiles();
      } else {
        toast.error("Pasta não encontrada ou sem permissão de acesso");
        navigate("/");
      }
    } catch (error) {
      console.error("Error fetching shared folder:", error);
      toast.error("Erro ao acessar pasta compartilhada");
      navigate("/");
    }
  };

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const [filesData, foldersData] = await Promise.all([
        driveService.listAllFiles(currentFolder),
        driveService.listFolders(currentFolder),
      ]);

      // Se for acesso compartilhado, filtra apenas os arquivos e pastas da pasta compartilhada
      if (isSharedFolder && sharedFolderId) {
        const filteredFiles = filesData.filter((file) => {
          const fileWithParents = file as unknown as { parents?: string[] };
          if (fileWithParents.parents?.includes(sharedFolderId)) {
            return true;
          }
          return folderPath.some((folder) => folder.id === sharedFolderId);
        });

        const filteredFolders = foldersData.filter((folder) => {
          const folderWithParents = folder as unknown as { parents?: string[] };
          if (folderWithParents.parents?.includes(sharedFolderId)) {
            return true;
          }
          return folderPath.some((f) => f.id === sharedFolderId);
        });

        setFiles(filteredFiles);
        setFolders(filteredFolders);
      } else {
        setFiles(filesData);
        setFolders(foldersData);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Erro ao carregar arquivos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = async (folderId: string, folderName: string) => {
    if (isSharedFolder) {
      // Se estiver em uma pasta compartilhada, não permite navegar para outras pastas
      toast.error("Acesso restrito à pasta compartilhada");
      return;
    }

    try {
      setIsLoading(true);
      const newFolder = { id: folderId, name: folderName };
      setFolderPath([...folderPath, newFolder]);
      setCurrentFolder(folderId);
    } catch (error) {
      console.error("Error navigating to folder:", error);
      toast.error("Erro ao acessar pasta");
    }
  };

  const handleBackClick = () => {
    if (isSharedFolder) {
      // Se estiver em uma pasta compartilhada, não permite voltar
      toast.error("Acesso restrito à pasta compartilhada");
      return;
    }

    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      const previousFolder =
        newPath.length > 0 ? newPath[newPath.length - 1].id : "root";
      setCurrentFolder(previousFolder);
    }
  };

  const handleCreateFolder = async (folderName: string) => {
    try {
      await driveService.createFolder(folderName, currentFolder);
      toast.success("Pasta criada com sucesso!");
      setShowCreateFolder(false);
      fetchFiles();
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Erro ao criar pasta");
    }
  };

  const handleUpload = async (files: FileList) => {
    try {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        await driveService.uploadFile(file, currentFolder);
      }
      toast.success("Arquivos enviados com sucesso!");
      fetchFiles();
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Erro ao enviar arquivos");
    }
  };

  const filterItems = (items: (File | Folder)[]) => {
    return items.filter((item) => {
      // Filtro por nome
      if (
        nameFilter &&
        !item.name.toLowerCase().includes(nameFilter.toLowerCase())
      ) {
        return false;
      }

      // Verifica se é uma pasta
      if (
        "mimeType" in item &&
        item.mimeType === "application/vnd.google-apps.folder"
      ) {
        return filterType === "all" || filterType === "folders";
      }
      // Verifica se é uma imagem
      if ("mimeType" in item && item.mimeType.startsWith("image/")) {
        return filterType === "all" || filterType === "images";
      }
      // Verifica se é um vídeo
      if ("mimeType" in item && item.mimeType.startsWith("video/")) {
        return filterType === "all" || filterType === "videos";
      }
      // Ignora outros tipos de arquivo
      return false;
    });
  };

  const handleFilterByName = () => {
    const allItems = [...folders, ...files];
    const filteredItems = filterItems(allItems);
    const filteredFolders = filteredItems.filter(
      (item) =>
        "mimeType" in item &&
        item.mimeType === "application/vnd.google-apps.folder"
    ) as Folder[];
    const filteredFiles = filteredItems.filter(
      (item) =>
        !(
          "mimeType" in item &&
          item.mimeType === "application/vnd.google-apps.folder"
        )
    ) as File[];
    setFolders(filteredFolders);
    setFiles(filteredFiles);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loading className="w-8 h-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {(folderPath.length > 0 || isSharedFolder) && (
              <Button
                variant="ghost"
                onClick={handleBackClick}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {currentFolder === "root" && !isSharedFolder
                  ? "Meus Arquivos"
                  : ""}
              </h1>
              {folderPath.length > 0 && (
                <div className="flex items-center gap-1 text-slate-400">
                  {folderPath.map((folder, index) => (
                    <div key={folder.id} className="flex items-center">
                      <span
                        className="cursor-pointer hover:text-white"
                        onClick={() => {
                          if (isSharedFolder && sharedFolderId) {
                            // Se estiver em uma pasta compartilhada, só permite navegar dentro dela
                            const sharedFolderIndex = folderPath.findIndex(
                              (f) => f.id === sharedFolderId
                            );
                            if (index < sharedFolderIndex) {
                              toast.error(
                                "Acesso restrito à pasta compartilhada"
                              );
                              return;
                            }
                          }
                          const newPath = folderPath.slice(0, index + 1);
                          setFolderPath(newPath);
                          setCurrentFolder(folder.id);
                        }}
                      >
                        {folder.name}
                      </span>
                      {index < folderPath.length - 1 && (
                        <ChevronDown className="w-4 h-4 rotate-90" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Nome do arquivo..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white"
              />
              <Button
                variant="outline"
                onClick={handleFilterByName}
                className="border-slate-800 bg-slate-900 text-white hover:bg-slate-800"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="border-slate-800 bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtrar Tipo
                <ChevronDown className="w-4 h-4" />
              </Button>
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-slate-900 ring-1 ring-slate-800 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setFilterType("all");
                        setShowFilterMenu(false);
                        handleFilterByName();
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        filterType === "all"
                          ? "bg-slate-800 text-white"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => {
                        setFilterType("images");
                        setShowFilterMenu(false);
                        handleFilterByName();
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        filterType === "images"
                          ? "bg-slate-800 text-white"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      Imagens
                    </button>
                    <button
                      onClick={() => {
                        setFilterType("videos");
                        setShowFilterMenu(false);
                        handleFilterByName();
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        filterType === "videos"
                          ? "bg-slate-800 text-white"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      Vídeos
                    </button>
                    <button
                      onClick={() => {
                        setFilterType("folders");
                        setShowFilterMenu(false);
                        handleFilterByName();
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        filterType === "folders"
                          ? "bg-slate-800 text-white"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      Pastas
                    </button>
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={() => setShowCreateFolder(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Pasta
            </Button>
            <Button
              onClick={() => setShowUpload(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {/* Folders */}
          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => handleFolderClick(folder.id, folder.name)}
              className="relative group cursor-pointer"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="w-full h-full flex items-center justify-center">
                  <FolderOpen className="w-12 h-12 text-purple-500" />
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-300 truncate">
                {folder.name}
              </div>
            </div>
          ))}

          {/* Files */}
          {files.map((file) => {
            const isVideo = file.mimeType.startsWith("video/");
            const isImage = file.mimeType.startsWith("image/");
            const Icon = isVideo ? Video : Image;
            const iconColor = isVideo ? "text-purple-500" : "text-green-500";

            if (!isVideo && !isImage) return null;

            return (
              <div
                key={file.id}
                className="relative group cursor-pointer"
                onClick={() => {
                  if (isImage && file.thumbnailLink) {
                    setSelectedFile(file);
                  } else if (isVideo && file.webViewLink) {
                    window.open(file.webViewLink, "_blank");
                  }
                }}
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
                  {file.thumbnailLink ? (
                    <img
                      src={file.thumbnailLink}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className={`w-12 h-12 ${iconColor}`} />
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-slate-300 truncate">
                  {file.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onCreateFolder={handleCreateFolder}
      />

      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
      />

      {/* Image Preview Modal */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-4xl bg-slate-900 border-slate-800 p-0 overflow-hidden">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 text-slate-400 hover:text-white bg-slate-900/50 rounded-full"
              onClick={() => setSelectedFile(null)}
            >
              <X className="w-4 h-4" />
            </Button>
            {selectedFile && (
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-3/4 relative">
                  <img
                    src={selectedFile.thumbnailLink}
                    alt={selectedFile.name}
                    className="w-full h-auto max-h-[70vh] object-contain bg-black"
                  />
                </div>
                <div className="w-full md:w-1/4 p-4 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white truncate">
                        {selectedFile.name}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        {selectedFile.mimeType.split("/")[1].toUpperCase()}
                      </p>
                    </div>
                    {selectedFile.size && (
                      <div>
                        <p className="text-sm font-medium text-slate-300">
                          Tamanho
                        </p>
                        <p className="text-sm text-slate-400">
                          {selectedFile.size}
                        </p>
                      </div>
                    )}
                    {selectedFile.createdTime && (
                      <div>
                        <p className="text-sm font-medium text-slate-300">
                          Criado em
                        </p>
                        <p className="text-sm text-slate-400">
                          {new Date(
                            selectedFile.createdTime
                          ).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    )}
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        className="w-full border-slate-800 bg-slate-900 text-white hover:bg-slate-800"
                        onClick={() => {
                          if (selectedFile.webViewLink) {
                            window.open(selectedFile.webViewLink, "_blank");
                          }
                        }}
                      >
                        Abrir no Google Drive
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Photos;
