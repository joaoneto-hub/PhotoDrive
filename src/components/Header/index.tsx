import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import PhotoDrive from "/PhotoDrive.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, MoreVertical } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <header className="bg-black border-b border-slate-800 fixed w-full top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <img src={PhotoDrive} alt="PhotoDrive" className="h-8 w-auto" />
          </div>

          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-white hidden sm:block">
                    {auth.currentUser?.displayName}
                  </span>
                  <img
                    src={auth.currentUser?.photoURL || ""}
                    alt="Profile"
                    className="h-8 w-8 rounded-full"
                  />
                  <MoreVertical className="h-5 w-5 text-slate-400" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800">
                <DropdownMenuItem
                  className="text-white hover:bg-slate-800 cursor-pointer"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-white hover:bg-slate-800 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
