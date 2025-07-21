import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "./contexts/LanguageContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Groups from "./pages/Groups";
import MyGroups from "./pages/MyGroups";
import Profile from "./pages/Profile";
import JoinGroup from "./pages/JoinGroup";
import CreateGroup from "./pages/CreateGroup";
import NotFound from "./pages/NotFound";
import './index.css'

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/groups" element={<MyGroups />} />
          <Route path="/create" element={<Groups />} />
          <Route path="/create-group" element={<CreateGroup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/join" element={<JoinGroup />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </LanguageProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
