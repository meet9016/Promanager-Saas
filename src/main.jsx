// main.jsx
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import store from "./redux/store";
import { Provider } from "react-redux";
import { HelmetProvider } from "@dr.pogodin/react-helmet";
import { FaWhatsapp } from "react-icons/fa";

ReactDOM.createRoot(document.getElementById("root")).render(
  <HelmetProvider>
    <BrowserRouter>
      <AuthProvider>
        <Provider store={store}>
          <App />
          
        </Provider>
      </AuthProvider>
    </BrowserRouter>
  </HelmetProvider>,
);
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}
