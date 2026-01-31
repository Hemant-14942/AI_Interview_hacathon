import { createContext, useState, useEffect } from "react";
import debug from "../utils/debug";
import api from "../api/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => !!localStorage.getItem("token"));
  const [userProfile, setUserProfile] = useState(null);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await api.get("/auth/me");
      setUserProfile({ name: res.data.name, email: res.data.email });
    } catch {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    if (user) {
      debug.component("AuthContext", "App load – token pehle se tha, fetching profile");
      fetchProfile();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  const login = (token) => {
    localStorage.setItem("token", token);
    setUser(true);
    debug.action("AuthContext", "Login – token save kiya");
    fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setUserProfile(null);
    debug.action("AuthContext", "Logout – token hata diya");
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
