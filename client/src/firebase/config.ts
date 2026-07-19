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
  passwordHash?: string;
}

/**
 * Helper to compute SHA-256 hash using the Web Crypto API.
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * WARNING: EmulatedAuth is a local-only simulation of Firebase Authentication using localStorage.
 * It does NOT provide production-grade security, secure credential storage, or cryptographic proof.
 * 
 * To migrate this to a real Firebase Authentication setup in production, the following is required:
 * 1. Initialize the Firebase Client SDK using initializeApp(config).
 * 2. Replace this class and emulatedAuth instance with imports from "firebase/auth", specifically
 *    using standard SDK methods: signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, and updateProfile.
 * 3. Enforce Server-Side rules (Firestore Security Rules or Firebase Functions) to perform authorization validation
 *    on the server rather than relying on client-side logic.
 * 4. Configure HTTPS and session token validation (JWT verification) for server communication.
 */
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

  async signInWithEmailAndPassword(email: string, password: string, roleForced?: UserRole): Promise<EmulatedUser> {
    // Find in local database or simulate
    const users = JSON.parse(localStorage.getItem('arenamind_db_users') || '[]');
    let user = users.find((u: EmulatedUser) => u.email.toLowerCase() === email.toLowerCase());

    const hashedVal = await hashPassword(password);

    if (user) {
      // Validate password if user has a password hash stored
      if (user.passwordHash) {
        if (user.passwordHash !== hashedVal) {
          throw new Error('Invalid password');
        }
      } else {
        // Store password hash for existing users who don't have one (e.g. pre-seeded users logging in the first time)
        user.passwordHash = hashedVal;
        localStorage.setItem('arenamind_db_users', JSON.stringify(users));
      }
    } else {
      // Create user on the fly if it matches a preset email format or default
      const username = email.split('@')[0];
      let resolvedRole: UserRole = 'spectator';
      if (['organizer', 'volunteer', 'security', 'medical', 'admin'].includes(username)) {
        resolvedRole = username as UserRole;
      }
      user = {
        uid: `uid_${crypto.randomUUID()}`,
        email,
        displayName: username.charAt(0).toUpperCase() + username.slice(1),
        role: roleForced || resolvedRole,
        passwordHash: hashedVal,
      };
      users.push(user);
      localStorage.setItem('arenamind_db_users', JSON.stringify(users));
    }

    this.currentUser = user;
    localStorage.setItem('arenamind_auth_user', JSON.stringify(user));
    this.notify();
    return user;
  }

  async createUserWithEmailAndPassword(email: string, displayName: string, role: UserRole, password?: string): Promise<EmulatedUser> {
    const users = JSON.parse(localStorage.getItem('arenamind_db_users') || '[]');
    if (users.find((u: EmulatedUser) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already in use');
    }

    const passwordHash = password ? await hashPassword(password) : undefined;

    const newUser: EmulatedUser = {
      uid: `uid_${crypto.randomUUID()}`,
      email,
      displayName,
      role,
      passwordHash,
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
  private cache: Map<string, any[]> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  public reset() {
    localStorage.clear();
    this.cache.clear();
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
    if (this.cache.has(collection)) {
      return this.cache.get(collection)!;
    }
    const key = `arenamind_db_${collection}`;
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      this.cache.set(collection, data);
      return data;
    } catch {
      return [];
    }
  }

  saveData(collection: string, data: any[]) {
    const key = `arenamind_db_${collection}`;
    localStorage.setItem(key, JSON.stringify(data));
    this.cache.set(collection, data);
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
