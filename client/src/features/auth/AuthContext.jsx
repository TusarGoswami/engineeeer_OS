import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../../services/auth.service.js';
import { userService } from '../../services/user.service.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Silent session restore on app load
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const refreshData = await authService.refresh();
        if (refreshData?.user && isMounted) {
          setUser(refreshData.user);
        }
      } catch {
        // Not logged in or expired cookie — expected for unauthenticated visitors
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async credentials => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      return data;
    } catch (err) {
      const message =
        err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async userData => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await authService.register(userData);
      setUser(data.user);
      return data;
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Registration failed.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const updateUser = useCallback(async updateData => {
    const updated = await userService.updateMe(updateData);
    setUser(updated);
    return updated;
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
