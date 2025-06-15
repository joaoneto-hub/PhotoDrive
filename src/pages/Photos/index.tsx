import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { driveService } from "@/services/drive";
import { authService } from "@/services/auth";
import { useUserData } from "@/hooks/use-user-data";
import { PhotoModal } from "@/components/PhotoModal";
import {
  Folder,
  Image,
  Video,
  ArrowLeft,
  Filter,
  ChevronDown,
  Search,
} from "lucide-react";
import type { DriveItem } from "@/services/drive";

const Photos = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<DriveItem[]>([]);
  const [allItems, setAllItems] = useState<DriveItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<DriveItem | null>(null);
  const [folderPath, setFolderPath] = useState<DriveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<DriveItem | null>(null);
  const [filterType, setFilterType] = useState<
    "all" | "images" | "videos" | "folders"
  >("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const { toast } = useToast();
  const { userData } = useUserData();

  const filterItems = (items: DriveItem[]) => {
    return items.filter((item) => {
      // Filtro por nome
      if (
        nameFilter &&
        !item.name.toLowerCase().includes(nameFilter.toLowerCase())
      ) {
        return false;
      }

      // Verifica se é uma pasta
      if (item.mimeType === "application/vnd.google-apps.folder") {
        return filterType === "all" || filterType === "folders";
      }
      // Verifica se é uma imagem
      if (item.mimeType.startsWith("image/")) {
        return filterType === "all" || filterType === "images";
      }
      // Verifica se é um vídeo
      if (item.mimeType.startsWith("video/")) {
        return filterType === "all" || filterType === "videos";
      }
      return false;
    });
  };

  useEffect(() => {
    const loadItems = async () => {
      try {
        setIsLoading(true);
        const user = authService.getCurrentUser();
        if (!user) {
          navigate("/login");
          return;
        }

        const hasDriveAccess =
          localStorage.getItem("hasDriveAccess") === "true";
        let folderId: string | undefined;

        if (!hasDriveAccess) {
          folderId = await driveService.getSharedFolderId();
        } else {
          // Quando tem acesso geral, carrega diretamente os itens do Drive raiz
          const rootFolder = await driveService.getFolderInfo("root");
          const fetchedItems = await driveService.listAllFiles("root");
          setAllItems(fetchedItems);
          const filteredItems = filterItems(fetchedItems);
          setItems(filteredItems);
          setCurrentFolder(rootFolder);
          setFolderPath([rootFolder]);
          setIsLoading(false);
          return;
        }

        const fetchedItems = await driveService.listAllFiles(folderId);
        setAllItems(fetchedItems);
        const filteredItems = filterItems(fetchedItems);
        setItems(filteredItems);

        // Se não tiver acesso total, definir a pasta compartilhada como pasta atual
        if (!hasDriveAccess && folderId) {
          const sharedFolder = fetchedItems.find(
            (item) => item.id === folderId
          );
          if (sharedFolder) {
            setCurrentFolder(sharedFolder);
            setFolderPath([sharedFolder]);
          }
        }
      } catch (error) {
        console.error("Error loading items:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os itens",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userData) {
      loadItems();
    }
  }, [navigate, toast, userData]);

  const handleItemClick = async (item: DriveItem) => {
    if (item.mimeType === "application/vnd.google-apps.folder") {
      try {
        setIsLoading(true);
        const folderInfo = await driveService.getFolderInfo(item.id);
        const fetchedItems = folderInfo.items || [];
        setAllItems(fetchedItems);
        const filteredItems = filterItems(fetchedItems);
        setCurrentFolder(folderInfo);
        setFolderPath([...folderPath, item]);
        setItems(filteredItems);
      } catch (error) {
        console.error("Error loading folder:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a pasta",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else if (
      item.mimeType.startsWith("image/") ||
      item.mimeType.startsWith("video/")
    ) {
      setSelectedPhoto(item);
    }
  };

  const handleBackClick = async () => {
    if (folderPath.length === 0) {
      return;
    }

    try {
      setIsLoading(true);
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);

      if (newPath.length === 0) {
        const hasDriveAccess =
          localStorage.getItem("hasDriveAccess") === "true";
        let folderId: string | undefined;

        if (!hasDriveAccess) {
          folderId = await driveService.getSharedFolderId();
        } else {
          // Quando tem acesso geral, carrega a pasta raiz do Drive
          folderId = "root";
        }

        const fetchedItems = await driveService.listAllFiles(folderId);
        setAllItems(fetchedItems);
        const filteredItems = filterItems(fetchedItems);
        setItems(filteredItems);
        setCurrentFolder(null);
      } else {
        const lastFolder = newPath[newPath.length - 1];
        const folderInfo = await driveService.getFolderInfo(lastFolder.id);
        const fetchedItems = folderInfo.items || [];
        setAllItems(fetchedItems);
        const filteredItems = filterItems(fetchedItems);
        setCurrentFolder(folderInfo);
        setItems(filteredItems);
      }
    } catch (error) {
      console.error("Error going back:", error);
      toast({
        title: "Erro",
        description: "Não foi possível voltar para a pasta anterior",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterByName = () => {
    const filteredItems = filterItems(allItems);
    setItems(filteredItems);
  };

  const renderItem = (item: DriveItem) => {
    const isFolder = item.mimeType === "application/vnd.google-apps.folder";
    const isVideo = item.mimeType.startsWith("video/");
    const Icon = isFolder ? Folder : isVideo ? Video : Image;

    return (
      <div
        key={item.id}
        className="relative group cursor-pointer"
        onClick={() => handleItemClick(item)}
      >
        <div className="aspect-square rounded-lg overflow-hidden bg-slate-800">
          {item.thumbnailLink ? (
            <img
              src={item.thumbnailLink}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon className="w-12 h-12 text-slate-600" />
            </div>
          )}
        </div>
        <div className="mt-2 text-sm text-slate-300 truncate">{item.name}</div>
      </div>
    );
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading className="w-8 h-8" />
      </div>
    );
  }

  const hasDriveAccess = localStorage.getItem("hasDriveAccess") === "true";
  const pageTitle = currentFolder
    ? currentFolder.name
    : hasDriveAccess
    ? "Meu Drive"
    : "Pasta Compartilhada";

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {folderPath.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackClick}
                className="text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleFilterByName}
                className="border-slate-700 text-white flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Filtrar
              </Button>
              <Input
                type="text"
                placeholder="Nome do arquivo..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="border-slate-700 text-white hover:bg-slate-800 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtrar Tipo
                <ChevronDown className="w-4 h-4" />
              </Button>
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-slate-800 ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setFilterType("all");
                        setShowFilterMenu(false);
                        handleFilterByName();
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        filterType === "all"
                          ? "bg-slate-700 text-white"
                          : "text-slate-300 hover:bg-slate-700"
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
                          ? "bg-slate-700 text-white"
                          : "text-slate-300 hover:bg-slate-700"
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
                          ? "bg-slate-700 text-white"
                          : "text-slate-300 hover:bg-slate-700"
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
                          ? "bg-slate-700 text-white"
                          : "text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Pastas
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loading className="w-8 h-8" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {items.map(renderItem)}
          </div>
        )}
      </div>

      {selectedPhoto && (
        <PhotoModal
          photoUrl={`https://drive.google.com/file/d/${selectedPhoto.id}/preview`}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
};

export default Photos;
