import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types/migration";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<boolean>;
  logout: () => void;
}

const BACKEND_BASE_URL = "https://accesstokens-aecjbzaqaqcuh6bd.eastus-01.azurewebsites.net";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check Azure AD authentication status by calling the backend
  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/workspaces`, {
        credentials: "include",
      });

      if (response.ok) {
        // User is authenticated via Azure AD
        const storedName = sessionStorage.getItem("azure_user_name");
        const storedEmail = sessionStorage.getItem("azure_user_email");
        const storedOid = sessionStorage.getItem("azure_user_oid");

        setUser({
          id: storedOid || "1",
          name: storedName || "User",
          email: storedEmail || "",
        });
        sessionStorage.setItem("powerbi_authenticated", "true");
        return true;
      }
    } catch (error) {
      console.error("Azure AD auth check failed:", error);
    }

    return false;
  };

  // Check for local/session-based authentication
  const checkLocalAuth = (): boolean => {
    const isLocalAuth = sessionStorage.getItem("local_authenticated") === "true";
    const isPowerBIAuth = sessionStorage.getItem("powerbi_authenticated") === "true";
    if (isLocalAuth || isPowerBIAuth) {
      const storedName = sessionStorage.getItem("azure_user_name");
      const storedEmail = sessionStorage.getItem("azure_user_email");
      const storedOid = sessionStorage.getItem("azure_user_oid");

      setUser({
        id: storedOid || "1",
        name: storedName || "User",
        email: storedEmail || "",
      });
      return true;
    }
    return false;
  };

  // Check auth on mount - try local first, then Azure AD
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      // First check local auth (faster, no network call)
      if (checkLocalAuth()) {
        setIsLoading(false);
        return;
      }

      // Then check Azure AD auth
      await checkAuth();
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("powerbi_authenticated");
    sessionStorage.removeItem("local_authenticated");
    sessionStorage.removeItem("azure_user_name");
    sessionStorage.removeItem("azure_user_email");
    sessionStorage.removeItem("azure_user_oid");
    sessionStorage.removeItem("azure_user_tenant");
    // Optionally call backend logout endpoint
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
