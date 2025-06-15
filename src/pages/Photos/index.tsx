import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { driveService } from "@/services/drive";
import type { Photo, Folder } from "@/types/photo";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  FolderIcon,
  ImageIcon,
  VideoIcon,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PhotoModal } from "@/components/PhotoModal";

export default function Photos() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<Array<Photo | Folder>>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const folderIdToUse = folderId || undefined;
        const fetchedItems = await driveService.listFolders(folderIdToUse);
        setItems(fetchedItems);

        if (folderIdToUse) {
          const folderInfo = await driveService.getFolderInfo(folderIdToUse);
          setCurrentFolder(folderInfo);
          const path = await driveService.getFolderPath(folderIdToUse);
          setFolderPath(path);
        } else {
          setCurrentFolder(null);
          setFolderPath([]);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
        let errorMessage = "Não foi possível carregar os itens";

        if (error instanceof Error) {
          if (error.message === "No shared folder ID found") {
            errorMessage =
              "Nenhuma pasta compartilhada encontrada. Por favor, compartilhe uma pasta primeiro.";
          } else if (error.message === "No user logged in") {
            errorMessage =
              "Você precisa estar logado para acessar esta página.";
          } else if (error.message === "Folder not accessible") {
            errorMessage = "Você não tem permissão para acessar esta pasta.";
          }
        }

        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [folderId, toast]);

  const handleItemClick = async (item: Photo | Folder) => {
    if ("mimeType" in item) {
      // É uma foto ou vídeo
      try {
        setIsLoadingMedia(true);
        console.log("Tentando abrir mídia:", item);
        const url = await driveService.getPhotoUrl(item.id);
        console.log("URL obtida:", url);
        setSelectedPhoto(item);
        setPhotoUrl(url);
      } catch (error) {
        console.error("Error opening media:", error);
        toast({
          title: "Erro",
          description: "Não foi possível abrir o arquivo",
          variant: "destructive",
        });
      } finally {
        setIsLoadingMedia(false);
      }
    } else {
      // É uma pasta
      navigate(`/photos/${item.id}`);
    }
  };

  const handleCloseModal = () => {
    setSelectedPhoto(null);
    setPhotoUrl(null);
  };

  const handleBack = () => {
    if (currentFolder) {
      navigate("/photos");
    }
  };

  const handlePathClick = (folder: Folder) => {
    navigate(`/photos/${folder.id}`);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 w-full h-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, index) => (
            <div
              key={index}
              className="h-24 bg-slate-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const renderItem = (item: Photo | Folder) => {
    // Verificar o tipo do item usando o mimeType
    const isFolder = item.mimeType === "application/vnd.google-apps.folder";
    const isImage = !isFolder && item.mimeType?.startsWith("image/");
    const isVideo = !isFolder && item.mimeType?.startsWith("video/");

    console.log("Rendering item:", {
      name: item.name,
      mimeType: item.mimeType,
      isFolder,
      isVideo,
      isImage,
    });

    return (
      <motion.div
        layout
        className="flex items-center p-3 md:p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {isFolder ? (
          <FolderIcon className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2 md:mr-3" />
        ) : isVideo ? (
          <VideoIcon className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2 md:mr-3" />
        ) : isImage ? (
          <ImageIcon className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2 md:mr-3" />
        ) : (
          <FolderIcon className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2 md:mr-3" />
        )}
        <span className="text-white text-sm md:text-base truncate">
          {item.name}
        </span>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background w-full h-full">
      {/* Header com navegação */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b w-full">
        <div className="w-full px-2 md:px-4 py-2 md:py-4">
          <div className="flex items-center space-x-1 md:space-x-2 overflow-x-auto pb-2 md:pb-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className={cn(!currentFolder && "invisible", "flex-shrink-0")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/photos")}
              className="text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <Home className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Início</span>
            </Button>

            {folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center flex-shrink-0">
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 md:mx-2" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePathClick(folder)}
                  className={cn(
                    "text-muted-foreground hover:text-foreground",
                    index === folderPath.length - 1 &&
                      "text-foreground font-medium"
                  )}
                >
                  <span className="max-w-[100px] md:max-w-[200px] truncate">
                    {folder.name}
                  </span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="w-full h-full p-2 md:p-4">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 md:py-16"
          >
            <h2 className="text-xl md:text-2xl font-semibold mb-2 text-white">
              {currentFolder
                ? "Esta pasta está vazia"
                : "Nenhum item encontrado"}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              {currentFolder
                ? "Adicione arquivos ou pastas para começar"
                : "Adicione itens à sua pasta compartilhada para começar"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 md:gap-4 w-full"
          >
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  variants={itemAnimation}
                  layout
                  className="group w-full"
                  onClick={() => handleItemClick(item)}
                >
                  {renderItem(item)}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoadingMedia && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 p-6 rounded-lg flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-white text-lg">Carregando mídia...</p>
          </div>
        </div>
      )}

      {/* Modal de Foto */}
      {selectedPhoto && photoUrl && (
        <PhotoModal
          isOpen={!!selectedPhoto}
          onClose={handleCloseModal}
          photoUrl={photoUrl}
          photoName={selectedPhoto.name}
          mimeType={selectedPhoto.mimeType}
        />
      )}
    </div>
  );
}
