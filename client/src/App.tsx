import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { EditorPage } from "./pages/EditorPage";
import { ImageSelectionPage } from "./pages/ImageSelectionPage";
import { StartPage } from "./pages/StartPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/select-images/:id" element={<ImageSelectionPage />} />
        <Route path="/edit/:id" element={<EditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
