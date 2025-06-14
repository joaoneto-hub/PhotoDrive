import { useNavigate, useLocation } from "react-router-dom";
import {
  Settings,
  Upload,
  FolderOpen,
  Home,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      path: "/dashboard",
    },
    {
      title: "Minhas Fotos",
      icon: FolderOpen,
      path: "/photos",
    },
    {
      title: "Upload",
      icon: Upload,
      path: "/upload",
    },
    {
      title: "Configurações",
      icon: Settings,
      path: "/settings",
    },
  ];

  return (
    <aside
      className={`bg-black border-r border-slate-800 h-screen fixed left-0 top-16 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-white transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-4 py-3 text-sm transition-colors ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">{item.title}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
