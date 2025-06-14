import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, Link, Share2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { driveService } from "@/services/drive";

const Settings = () => {
  const [folderLink, setFolderLink] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCurrentFolder = async () => {
      try {
        const folderId = await driveService.getSharedFolderId();
        setCurrentFolderId(folderId);
      } catch (error) {
        console.error("Erro ao buscar pasta atual:", error);
      }
    };

    fetchCurrentFolder();
  }, []);

  const handleSaveFolderLink = async () => {
    if (!folderLink) {
      toast({
        title: "Erro",
        description: "Por favor, insira o link da pasta compartilhada.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Extrair o ID da pasta do link
      const folderId = folderLink.split("/").pop();
      if (!folderId) {
        toast({
          title: "Erro",
          description: "Link inválido. Por favor, verifique o link da pasta.",
          variant: "destructive",
        });
        return;
      }

      // Salvar o ID da pasta no Firestore
      await driveService.saveSharedFolderId(folderId);
      setCurrentFolderId(folderId);
      setFolderLink("");
      toast({
        title: "Sucesso",
        description: "Link da pasta salvo com sucesso!",
      });
    } catch (error: unknown) {
      console.error("Erro ao salvar link da pasta:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o link da pasta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFolderLink = async () => {
    try {
      setRemoving(true);
      await driveService.removeSharedFolderId();
      setCurrentFolderId(null);
      toast({
        title: "Sucesso",
        description: "Link da pasta removido com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao remover link da pasta:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao remover o link da pasta.",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="p-6 bg-black min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-6">Configurações</h1>
      <Tabs defaultValue="drive-access" className="w-full">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="drive-access" className="text-white">
            Acesso ao Drive
          </TabsTrigger>
          <TabsTrigger value="general" className="text-white">
            Geral
          </TabsTrigger>
        </TabsList>
        <TabsContent value="drive-access" className="mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                Acesso à Pasta Compartilhada
              </CardTitle>
              <CardDescription className="text-slate-400">
                Para acessar apenas uma pasta específica do Google Drive, siga
                os passos abaixo:
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentFolderId && (
                <div className="mb-6 p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FolderOpen className="h-5 w-5 mr-2 text-primary" />
                      <span className="text-white">
                        Pasta atual: {currentFolderId}
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveFolderLink}
                      disabled={removing}
                      className="flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {removing ? "Removendo..." : "Remover"}
                    </Button>
                  </div>
                </div>
              )}
              <ul className="list-none space-y-4 mb-6">
                <li className="flex items-center text-slate-400">
                  <FolderOpen className="h-5 w-5 mr-2 text-primary" />
                  Crie uma pasta no Google Drive chamada "PhotoDrive".
                </li>
                <li className="flex items-center text-slate-400">
                  <Share2 className="h-5 w-5 mr-2 text-primary" />
                  Clique com o botão direito na pasta e selecione
                  "Compartilhar".
                </li>
                <li className="flex items-center text-slate-400">
                  <Link className="h-5 w-5 mr-2 text-primary" />
                  Na janela de compartilhamento, clique em "Qualquer pessoa com
                  o link" e selecione "Visualizador".
                </li>
                <li className="flex items-center text-slate-400">
                  <Link className="h-5 w-5 mr-2 text-primary" />
                  Copie o link da pasta compartilhada e cole abaixo.
                </li>
              </ul>
              <div className="flex flex-col space-y-4">
                <Input
                  type="text"
                  value={folderLink}
                  onChange={(e) => setFolderLink(e.target.value)}
                  placeholder="Cole o link da pasta compartilhada aqui"
                  className="bg-slate-700 text-white border-slate-600 focus:ring-primary"
                />
                <Button
                  onClick={handleSaveFolderLink}
                  disabled={loading}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {loading ? (
                    <Skeleton className="h-6 w-full" />
                  ) : (
                    "Salvar Link da Pasta"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="general" className="mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Configurações Gerais</CardTitle>
              <CardDescription className="text-slate-400">
                Gerencie suas preferências do PhotoDrive.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-slate-300">
                Aqui você poderá configurar preferências futuras do sistema.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
