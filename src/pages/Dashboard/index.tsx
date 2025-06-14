import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { driveService } from "@/services/drive";
import type { Photo, Folder } from "@/types/photo";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFolders: 0,
    totalPhotos: 0,
    storageUsed: 0,
    storageTotal: 10, // 10GB total storage
  });
  const [foldersData, setFoldersData] = useState<
    Array<{ name: string; value: number }>
  >([]);
  const [photosPerFolder, setPhotosPerFolder] = useState<
    Array<{ name: string; photos: number }>
  >([]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const sharedFolderId = await driveService.getSharedFolderId();

        // Fetch all folders and files in the shared folder
        const allItems = await driveService.listAllFiles(sharedFolderId);

        // Calculate statistics
        const folders = allItems.filter(
          (item): item is Folder => !("mimeType" in item)
        );
        const photos = allItems.filter(
          (item): item is Photo => "mimeType" in item
        );

        // Prepare data for charts
        const folderStats = await Promise.all(
          folders.map(async (folder) => {
            const photosInFolder = await driveService.listPhotos(folder.id);
            return {
              name: folder.name,
              value: photosInFolder.length,
              photos: photosInFolder.length,
            };
          })
        );

        setStats({
          totalFolders: folders.length,
          totalPhotos: photos.length,
          storageUsed: 6.5, // This would need to be calculated based on actual file sizes
          storageTotal: 10,
        });

        setFoldersData(folderStats.map(({ name, value }) => ({ name, value })));
        setPhotosPerFolder(
          folderStats.map(({ name, photos }) => ({ name, photos }))
        );
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-white">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Estatísticas Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-slate-300">Total de Pastas</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalFolders}
                </p>
              </div>
              <div>
                <p className="text-slate-300">Total de Fotos</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalPhotos}
                </p>
              </div>
              <div>
                <p className="text-slate-300">Armazenamento</p>
                <Progress
                  value={(stats.storageUsed / stats.storageTotal) * 100}
                  className="mt-2"
                />
                <p className="text-sm text-slate-400 mt-1">
                  {stats.storageUsed}GB de {stats.storageTotal}GB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Distribuição de Pastas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={foldersData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {foldersData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Fotos por Pasta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={photosPerFolder}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="photos" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
