import { createContext } from 'react';
import type { EmulatedUser } from '../firebase/config';

export interface AuthContextType {
  user: EmulatedUser | null;
  loading: boolean;
  login: (email: string, roleForced?: string) => Promise<EmulatedUser>;
  signup: (email: string, displayName: string, role: string) => Promise<EmulatedUser>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (displayName: string, photoURL?: string) => Promise<void>;
  switchRole: (role: 'spectator' | 'organizer' | 'volunteer' | 'security' | 'medical' | 'admin') => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
