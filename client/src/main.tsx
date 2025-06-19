import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ConfigProvider } from "./context/ConfigContext";
import { AuthProvider } from "./context/AuthContext";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </AuthProvider>
);
