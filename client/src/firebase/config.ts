// Firebase / LocalStorage Emulator configuration for ArenaMind AI
import { useEffect, useState } from 'react';
import type { Ticket, UserRole } from '../types';
import { 
  DEFAULT_USERS, 
  DEFAULT_MATCHES, 
  DEFAULT_GATES, 
  DEFAULT_FACILITIES, 
  DEFAULT_PARKING, 
  DEFAULT_ALERTS 
} from '../utils/constants';

// Interfaces for our emulated Firebase
export interface EmulatedUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  ticketInfo?: Ticket | null;
}

class EmulatedAuth {
  private listeners: Set<(user: EmulatedUser | null) => void> = new Set();
  private currentUser: EmulatedUser | null = null;

  constructor() {
    // Load from local storage if available
    const savedUser = localStorage.getItem('arenamind_auth_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch {
        this.currentUser = null;
      }
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: EmulatedUser | null) => void) {
    this.listeners.add(callback);
    // Initial call
    callback(this.currentUser);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }

  async signInWithEmailAndPassword(email: string, roleForced?: UserRole): Promise<EmulatedUser> {
    // Find in local database or simulate
    const users = JSON.parse(localStorage.getItem('arenamind_db_users') || '[]');
    let user = users.find((u: EmulatedUser) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Create user on the fly if it matches a preset email format or default
      const username = email.split('@')[0];
      let resolvedRole: UserRole = 'spectator';
      if (['organizer', 'volunteer', 'security', 'medical', 'admin'].includes(username)) {
        resolvedRole = username as UserRole;
      }
      user = {
        uid: `uid_${Math.random().toString(36).substr(2, 9)}`,
        email,
        displayName: username.charAt(0).toUpperCase() + username.slice(1),
        role: roleForced || resolvedRole,
      };
      users.push(user);
      localStorage.setItem('arenamind_db_users', JSON.stringify(users));
    }

    this.currentUser = user;
    localStorage.setItem('arenamind_auth_user', JSON.stringify(user));
    this.notify();
    return user;
  }

  async createUserWithEmailAndPassword(email: string, displayName: string, role: UserRole): Promise<EmulatedUser> {
    const users = JSON.parse(localStorage.getItem('arenamind_db_users') || '[]');
    if (users.find((u: EmulatedUser) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already in use');
    }

    const newUser: EmulatedUser = {
      uid: `uid_${Math.random().toString(36).substr(2, 9)}`,
      email,
      displayName,
      role,
    };

    users.push(newUser);
    localStorage.setItem('arenamind_db_users', JSON.stringify(users));
    
    this.currentUser = newUser;
    localStorage.setItem('arenamind_auth_user', JSON.stringify(newUser));
    this.notify();
    return newUser;
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('arenamind_auth_user');
    this.notify();
  }

  async updateProfile(updates: Partial<EmulatedUser>) {
    if (!this.currentUser) return;
    this.currentUser = { ...this.currentUser, ...updates };
    localStorage.setItem('arenamind_auth_user', JSON.stringify(this.currentUser));
    
    const users = JSON.parse(localStorage.getItem('arenamind_db_users') || '[]');
    const idx = users.findIndex((u: EmulatedUser) => u.uid === this.currentUser?.uid);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      localStorage.setItem('arenamind_db_users', JSON.stringify(users));
    }
    this.notify();
  }

  async sendPasswordResetEmail(email: string) {
    // Simulated pass reset
    console.log(`Password reset email sent to ${email}`);
    return true;
  }
}

// Database Mocking
class EmulatedFirestore {
  private collectionListeners: Map<string, Set<(data: any[]) => void>> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  public reset() {
    localStorage.clear();
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Seed default users if empty
    if (!localStorage.getItem('arenamind_db_users')) {
      localStorage.setItem('arenamind_db_users', JSON.stringify(DEFAULT_USERS));
    }

    // Seed matches
    if (!localStorage.getItem('arenamind_db_matches')) {
      localStorage.setItem('arenamind_db_matches', JSON.stringify(DEFAULT_MATCHES));
    }

    // Seed gates
    if (!localStorage.getItem('arenamind_db_gates')) {
      localStorage.setItem('arenamind_db_gates', JSON.stringify(DEFAULT_GATES));
    }

    // Seed facilities (Food courts, restrooms)
    if (!localStorage.getItem('arenamind_db_facilities')) {
      localStorage.setItem('arenamind_db_facilities', JSON.stringify(DEFAULT_FACILITIES));
    }

    // Seed parking
    if (!localStorage.getItem('arenamind_db_parking')) {
      localStorage.setItem('arenamind_db_parking', JSON.stringify(DEFAULT_PARKING));
    }

    // Seed alerts
    if (!localStorage.getItem('arenamind_db_alerts')) {
      localStorage.setItem('arenamind_db_alerts', JSON.stringify(DEFAULT_ALERTS));
    }
  }

  getData(collection: string) {
    const key = `arenamind_db_${collection}`;
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  saveData(collection: string, data: any[]) {
    const key = `arenamind_db_${collection}`;
    localStorage.setItem(key, JSON.stringify(data));
    this.notifyCollection(collection);
  }

  subscribeCollection(collection: string, callback: (data: any[]) => void) {
    if (!this.collectionListeners.has(collection)) {
      this.collectionListeners.set(collection, new Set());
    }
    this.collectionListeners.get(collection)!.add(callback);
    callback(this.getData(collection));
    return () => {
      this.collectionListeners.get(collection)?.delete(callback);
    };
  }

  private notifyCollection(collection: string) {
    const listeners = this.collectionListeners.get(collection);
    if (listeners) {
      const data = this.getData(collection);
      listeners.forEach((listener) => listener(data));
    }
  }
}

export const emulatedAuth = new EmulatedAuth();
export const emulatedDb = new EmulatedFirestore();

/**
 * Role-Based Access Control (RBAC) authorization checks for database mutations.
 * Throws an Error if the specified userRole does not have mutate permissions on the collection.
 */
export function checkRoleAuthorization(userRole: UserRole, collectionName: string, action: 'create' | 'update'): void {
  if (action === 'update') {
    if (userRole === 'spectator') {
      throw new Error(`Unauthorized: Spectators do not have write access to the '${collectionName}' collection.`);
    }

    if (collectionName === 'matches' && !['organizer', 'admin'].includes(userRole)) {
      throw new Error(`Unauthorized: Role '${userRole}' cannot modify matches.`);
    }

    if (collectionName === 'gates' && !['organizer', 'admin', 'security'].includes(userRole)) {
      throw new Error(`Unauthorized: Role '${userRole}' cannot modify gate operations.`);
    }

    if (collectionName === 'facilities' && !['organizer', 'admin', 'medical'].includes(userRole)) {
      throw new Error(`Unauthorized: Role '${userRole}' cannot modify facilities.`);
    }
  } else if (action === 'create') {
    if (userRole === 'spectator' && collectionName !== 'alerts') {
      throw new Error(`Unauthorized: Spectators can only create support alerts.`);
    }

    if (collectionName === 'matches' && !['organizer', 'admin'].includes(userRole)) {
      throw new Error(`Unauthorized: Role '${userRole}' cannot create matches.`);
    }

    if (collectionName === 'gates' && !['organizer', 'admin', 'security'].includes(userRole)) {
      throw new Error(`Unauthorized: Role '${userRole}' cannot create gate records.`);
    }
  }
}

// Standard hook helper for real-time collections
export function useRealtimeCollection<T>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    const unsubscribe = emulatedDb.subscribeCollection(collectionName, (newData) => {
      setData(newData);
    });
    return unsubscribe;
  }, [collectionName]);

  const updateItem = (itemId: string, updates: Partial<T>) => {
    const currentUser = emulatedAuth.getCurrentUser();
    const userRole = currentUser ? currentUser.role : 'spectator';

    // Verify RBAC access constraints
    checkRoleAuthorization(userRole, collectionName, 'update');

    const currentData = emulatedDb.getData(collectionName);
    const updated = currentData.map((item: T & { id: string }) => {
      if (item.id === itemId) {
        return { ...item, ...updates };
      }
      return item;
    });
    emulatedDb.saveData(collectionName, updated);
  };

  const addItem = (item: Omit<T, 'id' | 'timestamp'> & Partial<{ id: string; timestamp: string }>) => {
    const currentUser = emulatedAuth.getCurrentUser();
    const userRole = currentUser ? currentUser.role : 'spectator';

    // Verify RBAC access constraints
    checkRoleAuthorization(userRole, collectionName, 'create');

    const currentData = emulatedDb.getData(collectionName);
    const newItem = {
      id: `id_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...item,
    };
    currentData.push(newItem);
    emulatedDb.saveData(collectionName, currentData);
    return newItem;
  };

  return { data, updateItem, addItem };
}
