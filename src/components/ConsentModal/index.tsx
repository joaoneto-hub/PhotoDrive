import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentModal({ open, onAccept, onDecline }: ConsentModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="bg-black border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            Acesso ao Google Drive
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Para acessar suas fotos e pastas do Google Drive, precisamos da sua
            permissão. Ao aceitar, você nos autoriza a:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <ul className="list-disc pl-6 space-y-2 text-sm text-slate-300">
            <li>Visualizar suas pastas e arquivos do Google Drive</li>
            <li>Acessar suas fotos armazenadas no Google Drive</li>
            <li>Gerenciar suas fotos dentro do aplicativo</li>
          </ul>

          <div className="text-sm text-slate-300">
            Você pode continuar sem acesso ao Google Drive, mas não poderá
            visualizar ou gerenciar suas fotos.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onDecline}
            className="w-full sm:w-auto bg-black border-slate-700 text-white hover:bg-slate-600 cursor-pointer"
          >
            <X className="mr-2 h-4 w-4" />
            Continuar sem acesso
          </Button>
          <Button
            onClick={onAccept}
            className="w-full sm:w-auto bg-primary text-white hover:bg-secondary cursor-pointer"
          >
            <Check className="mr-2 h-4 w-4" />
            Permitir acesso ao Drive
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
