import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '@/services/api';

type AuthContextType = {
  isAuthenticated: boolean;
  apiKey: string | null;
  login: (apiKey: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 初始化时检查是否有保存的API密钥
  useEffect(() => {
    const checkAuth = async () => {
      const savedApiKey = apiService.getApiKey();
      if (savedApiKey) {
        setApiKey(savedApiKey);
        try {
          const connected = await apiService.checkConnection();
          setIsAuthenticated(connected);
        } catch (error) {
          console.error('Authentication check failed:', error);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // 登录函数
  const login = async (newApiKey: string): Promise<boolean> => {
    try {
      // 设置API密钥
      apiService.setApiKey(newApiKey);
      setApiKey(newApiKey);

      // 检查连接
      const connected = await apiService.checkConnection();
      setIsAuthenticated(connected);
      return connected;
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  // 登出函数
  const logout = () => {
    apiService.removeApiKey();
    setApiKey(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, apiKey, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
