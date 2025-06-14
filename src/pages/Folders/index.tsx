import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { driveService } from "@/services/drive";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FolderOpen, ChevronRight, ChevronLeft } from "lucide-react";

const DRIVE_API_BASE_URL = "https://www.googleapis.com/drive/v3";

interface Folder {
  id: string;
  name: string;
}

interface FolderPath {
  id: string;
  name: string;
}

const Folders = () => {
  const navigate = useNavigate();
  const { folderId } = useParams();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [folderPath, setFolderPath] = useState<FolderPath[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setLoading(true);
        const foldersList = await driveService.listFolders(folderId);
        console.log("Folders list:", foldersList);
        setFolders(foldersList);

        // Se estamos em uma pasta específica, buscar suas informações
        if (folderId) {
          const folderResponse = await fetch(
            `${DRIVE_API_BASE_URL}/files/${folderId}?fields=id,name,parents`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem(
                  "googleAccessToken"
                )}`,
              },
            }
          );

          if (folderResponse.ok) {
            const folderData = await folderResponse.json();

            // Construir o caminho da pasta
            const path: FolderPath[] = [];
            let currentParents = folderData.parents;

            while (currentParents && currentParents.length > 0) {
              const parentResponse = await fetch(
                `${DRIVE_API_BASE_URL}/files/${currentParents[0]}?fields=id,name,parents`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem(
                      "googleAccessToken"
                    )}`,
                  },
                }
              );

              if (parentResponse.ok) {
                const parentData = await parentResponse.json();
                path.unshift({
                  id: parentData.id,
                  name: parentData.name,
                });
                currentParents = parentData.parents;
              } else {
                break;
              }
            }

            // Adicionar a pasta atual ao caminho
            path.push({
              id: folderData.id,
              name: folderData.name,
            });

            setFolderPath(path);
          }
        } else {
          // Se estamos na raiz, buscar a pasta compartilhada
          const sharedFolderId = await driveService.getSharedFolderId();
          if (sharedFolderId) {
            const folderResponse = await fetch(
              `${DRIVE_API_BASE_URL}/files/${sharedFolderId}?fields=id,name`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                    "googleAccessToken"
                  )}`,
                },
              }
            );

            if (folderResponse.ok) {
              const folderData = await folderResponse.json();
              setFolderPath([
                {
                  id: folderData.id,
                  name: folderData.name,
                },
              ]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching folders:", error);
        toast({
          title: "Erro",
          description:
            "Não foi possível carregar as pastas. Por favor, tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, [folderId, toast]);

  const handleFolderClick = (folder: Folder) => {
    navigate(`/photos/${folder.id}`);
  };

  const handlePathClick = (folder: FolderPath) => {
    navigate(`/photos/${folder.id}`);
  };

  const handleBackClick = () => {
    if (folderPath.length > 1) {
      const parentFolder = folderPath[folderPath.length - 2];
      navigate(`/photos/${parentFolder.id}`);
    } else {
      navigate("/folders");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-400">
          <p className="text-lg mb-2">Nenhuma pasta encontrada</p>
          <p className="text-sm">
            Configure uma pasta compartilhada nas configurações para começar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Caminho da pasta */}
      <div className="flex items-center gap-2 mb-6 text-white">
        <button
          onClick={handleBackClick}
          className="text-primary hover:underline flex items-center"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Voltar
        </button>
        <div className="flex items-center gap-2">
          {folderPath.map((folder, index) => (
            <React.Fragment key={folder.id}>
              {index > 0 && <ChevronRight className="h-5 w-5 text-slate-400" />}
              <button
                onClick={() => handlePathClick(folder)}
                className={`hover:underline ${
                  index === folderPath.length - 1 ? "font-bold" : ""
                }`}
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Lista de pastas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => handleFolderClick(folder)}
            className="flex items-center p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <FolderOpen className="h-6 w-6 text-primary mr-3" />
            <span className="text-white">{folder.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Folders;
