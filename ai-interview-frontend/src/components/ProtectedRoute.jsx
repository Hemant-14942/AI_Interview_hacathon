import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import debug from "../utils/debug";

export default function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    debug.flow("ProtectedRoute – token nahi hai, login pe bhej rahe hain", { from: location.pathname });
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  debug.component("ProtectedRoute", "User logged in – protected content dikha rahe hain");
  return children;
}
