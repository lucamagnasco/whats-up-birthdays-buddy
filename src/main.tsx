import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "./contexts/LanguageContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Groups from "./pages/Groups";
import Profile from "./pages/Profile";
import JoinGroup from "./pages/JoinGroup";
import NotFound from "./pages/NotFound";
import './index.css'

function App() {
  console.log('App component rendering');
  return (
    <LanguageProvider>
      <div>
        <p>Language Provider is active</p>
        <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/join" element={<JoinGroup />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          <Toaster />
        </BrowserRouter>
      </div>
    </LanguageProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
