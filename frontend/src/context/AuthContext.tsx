import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'staff' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, role: 'patient' | 'staff') => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: 'patient' | 'staff'): Promise<boolean> => {
    setIsLoading(true);
    try {
      const endpoint = role === 'staff' ? `${API_URL}/auth/login/staff` : `${API_URL}/auth/login/patient`;
      
      const response = await axios.post(endpoint, { email, password });
      
      if (response.data) {
        const { access_token, user: userData, role: userRole } = response.data;
        
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setToken(access_token);
        setUser(userData);
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        
        // Redirect based on role
        if (userRole === 'staff') {
          navigate('/staff/dashboard');
        } else {
          navigate('/dashboard');
        }
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};