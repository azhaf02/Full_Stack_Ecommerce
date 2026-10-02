import apiClient from './apiClient';
import type { Address, AddressInput, User } from '../types/auth';

export const accountService = {
  getProfile: () => apiClient.get<User>('/api/account/profile').then((r) => r.data),

  updateProfile: (name: string) =>
    apiClient.put<User>('/api/account/profile', { name }).then((r) => r.data),

  changePassword: (current_password: string, new_password: string) =>
    apiClient.put('/api/account/password', { current_password, new_password }).then(() => undefined),

  listAddresses: () => apiClient.get<Address[]>('/api/account/addresses').then((r) => r.data),

  createAddress: (data: AddressInput) =>
    apiClient.post<Address>('/api/account/addresses', data).then((r) => r.data),

  updateAddress: (id: number, data: Partial<AddressInput>) =>
    apiClient.put<Address>(`/api/account/addresses/${id}`, data).then((r) => r.data),

  deleteAddress: (id: number) => apiClient.delete(`/api/account/addresses/${id}`).then(() => undefined),

  setDefaultAddress: (id: number) =>
    apiClient.put<Address>(`/api/account/addresses/${id}/default`).then((r) => r.data),
};
