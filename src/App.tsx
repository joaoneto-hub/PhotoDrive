import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Photos from "./pages/Photos";
import Folders from "./pages/Folders";
import Upload from "./pages/Upload";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/folders" element={<Folders />} />
          <Route path="/photos" element={<Navigate to="/folders" replace />} />
          <Route path="/photos/:folderId" element={<Photos />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
