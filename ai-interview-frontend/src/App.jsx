import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import SetupInterview from "./pages/SetupInterview";
import VoiceSelect from "./pages/VoiceSelect";
import LiveInterview from "./pages/LiveInterview";
import Result from "./pages/Result";
import debug from "./utils/debug";

function App() {
  debug.component("App", "App render ho raha hai, routes load ho rahe hain");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <SetupInterview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/voice/:id"
          element={
            <ProtectedRoute>
              <VoiceSelect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview/:id"
          element={
            <ProtectedRoute>
              <LiveInterview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/result/:id"
          element={
            <ProtectedRoute>
              <Result />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </BrowserRouter>
  );
}

export default App;
