import { Outlet } from "react-router-dom";
import Header from "../Header";
import Sidebar from "../Sidebar";

const Layout = () => {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <Sidebar />
      <main className="pt-16 pl-64 transition-all duration-300">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
