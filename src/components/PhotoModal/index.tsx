import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  photoName: string;
  mimeType?: string;
}

export function PhotoModal({
  isOpen,
  onClose,
  photoUrl,
  photoName,
  mimeType,
}: PhotoModalProps) {
  const [mediaError, setMediaError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState<string>("");
  const isVideo = mimeType?.startsWith("video/");

  useEffect(() => {
    if (isOpen) {
      console.log("Opening modal with URL:", photoUrl);
      console.log("Mime type:", mimeType);
      setIsLoading(true);
      setMediaError(false);

      // Obter o token de acesso
      const hasFullAccess = localStorage.getItem("hasDriveAccess") === "true";
      const accessToken = hasFullAccess
        ? localStorage.getItem("googleAccessToken")
        : localStorage.getItem("accessToken");

      if (!accessToken) {
        console.error("No access token found");
        setMediaError(true);
        setIsLoading(false);
        return;
      }

      // Converter a URL para um blob com o token de acesso
      fetch(photoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.blob();
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setImageSrc(url);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error loading image:", error);
          setMediaError(true);
          setIsLoading(false);
        });
    }
  }, [isOpen, photoUrl, mimeType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-[101] w-full h-full flex items-center justify-center p-4">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Botão de fechar */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 md:right-4 md:top-4 z-10 bg-black/50 hover:bg-black/70"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Conteúdo */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loading className="w-8 h-8 text-white" />
                </div>
              )}
              {isVideo ? (
                <video
                  src={imageSrc}
                  controls
                  className={`max-w-full max-h-full object-contain ${
                    isLoading ? "opacity-0" : "opacity-100"
                  } transition-opacity duration-200`}
                  style={{
                    maxHeight: "calc(100vh - 2rem)",
                    maxWidth: "calc(100vw - 2rem)",
                  }}
                  onLoadedData={() => {
                    console.log("Video loaded successfully");
                    setIsLoading(false);
                  }}
                  onError={(e) => {
                    console.error("Erro ao carregar vídeo:", e);
                    console.error("URL que falhou:", photoUrl);
                    setMediaError(true);
                    setIsLoading(false);
                  }}
                />
              ) : (
                <img
                  src={imageSrc}
                  alt={photoName}
                  className={`max-w-full max-h-full object-contain ${
                    isLoading ? "opacity-0" : "opacity-100"
                  } transition-opacity duration-200`}
                  style={{
                    maxHeight: "calc(100vh - 2rem)",
                    maxWidth: "calc(100vw - 2rem)",
                  }}
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.opacity = "1";
                  }}
                  onError={(e) => {
                    console.error("Erro ao carregar imagem:", e);
                    console.error("URL que falhou:", photoUrl);
                    setMediaError(true);
                    setIsLoading(false);
                  }}
                />
              )}
              {mediaError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white text-center p-4 bg-slate-800 rounded-lg">
                    <p className="text-lg font-medium mb-2">
                      {isVideo
                        ? "Não foi possível carregar o vídeo"
                        : "Não foi possível carregar a imagem"}
                    </p>
                    <p className="text-sm text-gray-400">
                      Verifique se você tem permissão para acessar este arquivo.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={onClose}
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
