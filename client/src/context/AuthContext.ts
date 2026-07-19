import { createContext } from 'react';
import type { EmulatedUser } from '../firebase/config';
import type { UserRole } from '../types';

export interface AuthContextType {
  user: EmulatedUser | null;
  loading: boolean;
  login: (email: string, password: string, roleForced?: UserRole) => Promise<EmulatedUser>;
  signup: (email: string, displayName: string, role: UserRole, password?: string) => Promise<EmulatedUser>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (displayName: string, photoURL?: string) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
