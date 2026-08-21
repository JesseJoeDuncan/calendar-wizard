import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { SplashScreen } from "./components/SplashScreen";
import { EditorPage } from "./pages/EditorPage";
import { ImageSelectionPage } from "./pages/ImageSelectionPage";
import { NewCalendarRedirect } from "./pages/NewCalendarRedirect";
import { StartPage } from "./pages/StartPage";

export default function App() {
  return (
    <BrowserRouter>
      <SplashScreen />
      <Routes>
        <Route path="/" element={<NewCalendarRedirect />} />
        <Route path="/new/:id" element={<StartPage />} />
        <Route path="/select-images/:id" element={<ImageSelectionPage />} />
        <Route path="/edit/:id" element={<EditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
