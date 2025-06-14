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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Photos() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<Array<Photo | Folder>>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);

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
        toast({
          title: "Erro",
          description: "Não foi possível carregar os itens",
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
      // É uma foto
      const url = await driveService.getPhotoUrl(item.id);
      window.open(url, "_blank");
    } else {
      // É uma pasta
      navigate(`/photos/${item.id}`);
    }
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
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
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

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const renderItem = (item: Photo | Folder) => {
    const isFolder = !("mimeType" in item);

    return (
      <motion.div
        layout
        className="flex items-center p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {isFolder ? (
          <FolderIcon className="h-6 w-6 text-primary mr-3" />
        ) : (
          <ImageIcon className="h-6 w-6 text-primary mr-3" />
        )}
        <span className="text-white">{item.name}</span>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header com navegação */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className={cn(!currentFolder && "invisible")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/photos")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4 mr-2" />
              Início
            </Button>

            {folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center">
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
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
                  {folder.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto p-4">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <h2 className="text-2xl font-semibold mb-2 text-white">
              {currentFolder
                ? "Esta pasta está vazia"
                : "Nenhum item encontrado"}
            </h2>
            <p className="text-muted-foreground">
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  variants={item}
                  layout
                  className="group"
                  onClick={() => handleItemClick(item)}
                >
                  {renderItem(item)}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
