import React, { useState, useEffect } from 'react';
import { emulatedAuth } from '../firebase/config';
import type { EmulatedUser } from '../firebase/config';
import { AuthContext } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<EmulatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = emulatedAuth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, roleForced?: string) => {
    setLoading(true);
    try {
      const res = await emulatedAuth.signInWithEmailAndPassword(email, roleForced);
      setUser(res);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, displayName: string, role: string) => {
    setLoading(true);
    try {
      const res = await emulatedAuth.createUserWithEmailAndPassword(email, displayName, role);
      setUser(res);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await emulatedAuth.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await emulatedAuth.sendPasswordResetEmail(email);
  };

  const updateUser = async (displayName: string, photoURL?: string) => {
    if (!user) return;
    await emulatedAuth.updateProfile({ displayName, photoURL });
    setUser(emulatedAuth.getCurrentUser());
  };

  const switchRole = async (role: 'spectator' | 'organizer' | 'volunteer' | 'security' | 'medical' | 'admin') => {
    if (!user) return;
    await emulatedAuth.updateProfile({ role });
    setUser(emulatedAuth.getCurrentUser());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        resetPassword,
        updateUser,
        switchRole,
      }}
    >
      {loading ? (
        <div className="flex h-screen w-screen items-center justify-center bg-[#0a0f1d]">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-400">AM</div>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
