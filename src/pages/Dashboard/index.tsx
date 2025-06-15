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
import { useUserData } from "@/hooks/use-user-data";
import { Loading } from "@/components/ui/loading";
import { Shield, Link } from "lucide-react";

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
  const { userData } = useUserData();
  const hasDriveAccess = localStorage.getItem("hasDriveAccess") === "true";

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        let folderId: string | undefined;

        if (!hasDriveAccess) {
          folderId = await driveService.getSharedFolderId();
        }

        // Fetch all folders and files
        const allItems = await driveService.listAllFiles(folderId);

        // Calculate statistics
        const folders = allItems.filter((item) => item.isFolder);
        const photos = allItems.filter((item) => item.isImage || item.isVideo);

        // Prepare data for charts
        const folderStats = await Promise.all(
          folders.map(async (folder) => {
            const photosInFolder = await driveService.listAllFiles(folder.id);
            const photosCount = photosInFolder.filter(
              (item) => item.isImage || item.isVideo
            ).length;
            return {
              name: folder.name,
              value: photosCount,
              photos: photosCount,
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

    if (userData) {
      fetchDashboardData();
    }
  }, [userData, hasDriveAccess]);

  if (!userData || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700">
          {hasDriveAccess ? (
            <>
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-slate-300">Acesso Geral</span>
            </>
          ) : (
            <>
              <Link className="w-5 h-5 text-green-400" />
              <span className="text-slate-300">Acesso por Link</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg sm:text-xl">
              Estatísticas Gerais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-slate-300 text-sm sm:text-base">
                  Total de Pastas
                </p>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {stats.totalFolders}
                </p>
              </div>
              <div>
                <p className="text-slate-300 text-sm sm:text-base">
                  Total de Fotos
                </p>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {stats.totalPhotos}
                </p>
              </div>
              <div>
                <p className="text-slate-300 text-sm sm:text-base">
                  Armazenamento
                </p>
                <Progress
                  value={(stats.storageUsed / stats.storageTotal) * 100}
                  className="mt-2"
                />
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {stats.storageUsed}GB de {stats.storageTotal}GB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg sm:text-xl">
              Distribuição de Pastas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] sm:h-[300px]">
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "0.5rem",
                      color: "#e2e8f0",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg sm:text-xl">
              Fotos por Pasta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={photosPerFolder}>
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "0.5rem",
                      color: "#e2e8f0",
                    }}
                  />
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
