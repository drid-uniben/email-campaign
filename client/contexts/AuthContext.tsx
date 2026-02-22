"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  ComponentType,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../services/api";
import {
  getToken,
  getUserData,
  clearAllData,
} from "../services/indexdb";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitialLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();



  // Check authentication on mount
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getToken("accessToken");
      const userData = await getUserData();

      if (!token || !userData) {
        setUser(null);
        return false;
      }

      try {
        const parsedUser = userData as User;

        // Verify the user role is admin
        if (parsedUser.role !== "admin") {
          await clearAllData();
          setUser(null);
          return false;
        }

        // Verify token with backend
        const response = await authApi.verifyToken();

        if (response.success && response.user.id === parsedUser.id && response.user.role === "admin") {
          setUser(parsedUser);
          return true;
        }

        return false;
      } catch (verifyError) {
        console.error("Token verification failed:", verifyError);
        await clearAllData();
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    const initialAuth = async () => {
      await checkAuth();
      setIsInitialLoading(false);
    };
    initialAuth();
  }, [checkAuth]);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.loginAdmin({ email, password });

      if (response.success && response.user) {
        if (response.user.role !== "admin") {
          throw new Error(
            `Invalid login. Your account is not an administrator.`
          );
        }
        setUser(response.user);
        router.push('/admin/email-campaign'); // Redirect to the primary admin page
      } else {
        throw new Error('Invalid login response');
      }
    } catch (err: unknown) {
      let errorMessage = 'An error occurred during login.';

      const authErrorMessages = [
        'Access denied: Admin privileges required',
        'Access denied: author privileges required',
        'Access denied: Reviewer privileges required',
        'No account found with this email address',
        'Incorrect password',
      ];

      const error = err as { response?: { data?: { message?: string } }, message?: string };

      if (error?.response?.data?.message && authErrorMessages.includes(error.response.data.message)) {
        errorMessage = 'Invalid credentials';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('Login error:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await clearAllData();
      setUser(null);
      setError(null);
      setIsLoading(false);
      router.push('/login'); // Always redirect to the login page
    }
  };

  // Clear error
  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isInitialLoading,
    isAuthenticated: !!user,
    error,
    login,
    logout,
    clearError,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protecting admin routes
export function withAdminAuth<P extends object>(
  Component: ComponentType<P>
) {
  return function AdminProtected(props: P) {
    const { user, isInitialLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isInitialLoading) {
        if (!user) {
          router.push('/admin/login');
        } else if (user.role !== 'admin') {
          router.push('/');
        }
      }
    }, [user, isInitialLoading, router]);

    if (isInitialLoading || !user || user.role !== 'admin') {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-journal-maroon-dark border-t-journal-maroon rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}


