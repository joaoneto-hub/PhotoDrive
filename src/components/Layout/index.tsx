import { Outlet } from "react-router-dom";
import Header from "../Header";
import Sidebar from "../Sidebar";

const Layout = () => {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <Sidebar />
      <main className="pt-16 pl-16 md:pl-64 transition-all duration-300 w-full">
        <div className="p-4 md:p-8 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
