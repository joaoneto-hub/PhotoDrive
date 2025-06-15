import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { useState } from "react";

interface PhotoModalProps {
  photoUrl: string;
  onClose: () => void;
}

export const PhotoModal = ({ photoUrl, onClose }: PhotoModalProps) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full h-full max-w-7xl max-h-[90vh] p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:bg-white/10"
        >
          <X className="w-6 h-6" />
        </Button>

        <div className="w-full h-full flex items-center justify-center">
          <iframe
            src={photoUrl}
            className={`w-full h-full rounded-lg transition-opacity duration-300 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => setIsLoading(false)}
            allow="autoplay"
          />
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loading className="w-8 h-8" />
          </div>
        )}
      </div>
    </div>
  );
};
