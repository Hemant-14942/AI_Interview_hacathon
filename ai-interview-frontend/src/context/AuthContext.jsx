import { createContext, useState } from "react";
import debug from "../utils/debug";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (token) debug.component("AuthContext", "App load – token pehle se tha, user logged in");
    return !!token;
  });

  const login = (token) => {
    localStorage.setItem("token", token);
    setUser(true);
    debug.action("AuthContext", "Login – token save kiya, user set");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    debug.action("AuthContext", "Logout – token hata diya");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
