import apiClient from './apiClient';
import type { TokenResponse, User } from '../types/auth';

export const authService = {
  register: (name: string, email: string, password: string) =>
    apiClient.post<User>('/api/auth/register', { name, email, password }).then((r) => r.data),

  login: (email: string, password: string) =>
    apiClient.post<TokenResponse>('/api/auth/login', { email, password }).then((r) => r.data),

  adminLogin: (email: string, password: string) =>
    apiClient.post<TokenResponse>('/api/auth/admin/login', { email, password }).then((r) => r.data),

  logout: () => apiClient.post('/api/auth/logout').then(() => undefined),

  me: () => apiClient.get<User>('/api/auth/me').then((r) => r.data),
};
