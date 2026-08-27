import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types";
import { loginUser, registerUser } from "../api/client";

const AUTH_STORAGE_KEY = "mystreamflix_auth_user";

interface AuthContextType {
  currentUser: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  loadingAuth: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoggedIn: false,
  isAdmin: false,
  loadingAuth: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Restore saved auth session on app boot
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.id) {
            setCurrentUser(parsed);
          }
        }
      } catch (err) {
        console.warn("Failed restoring auth session:", err);
      } finally {
        setLoadingAuth(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginUser(email, password);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      try {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.user));
      } catch {}
      return { success: true };
    }
    return { success: false, error: result.error || "Login gagal." };
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await registerUser(name, email, password);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      try {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.user));
      } catch {}
      return { success: true };
    }
    return { success: false, error: result.error || "Registrasi gagal." };
  }, []);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn: !!currentUser,
        isAdmin: currentUser?.role === "admin",
        loadingAuth,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);