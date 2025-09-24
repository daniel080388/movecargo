"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    }
  }, []);

  async function fetchUser(jwt: string) {
    try {
      const res = await fetch((typeof window !== 'undefined' ? window.location.origin : '') + "/api/auth/me", {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) {
        const txt = await res.text();
        try {
          const parsed = JSON.parse(txt);
          console.warn("Auth me error:", parsed);
        } catch {
          console.warn("Auth me error (text):", txt);
        }
        throw new Error("Token inválido");
      }
      const data = await res.json();
      setUser(data);
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
    }
  }

  const login = async (email: string, password: string) => {
    const res = await fetch((typeof window !== 'undefined' ? window.location.origin : '') + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const txt = await res.text();
      let errText = txt;
      try {
        const parsed = JSON.parse(txt);
        errText = parsed?.error || JSON.stringify(parsed);
      } catch {}
      throw new Error(errText);
    }

    const data = await res.json();
    setToken(data.token);
    localStorage.setItem("token", data.token);
    setUser({ name: data.name, role: data.role, id: data.uid, email });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
};
