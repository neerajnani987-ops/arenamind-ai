// Firebase / LocalStorage Emulator configuration for ArenaMind AI
import { useEffect, useState } from 'react';

// Interfaces for our emulated Firebase
export interface EmulatedUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'spectator' | 'organizer' | 'volunteer' | 'security' | 'medical' | 'admin';
  ticketInfo?: any;
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

  async signInWithEmailAndPassword(email: string, roleForced?: any): Promise<EmulatedUser> {
    // Find in local database or simulate
    const users = JSON.parse(localStorage.getItem('arenamind_db_users') || '[]');
    let user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Create user on the fly if it matches a preset email format or default
      const username = email.split('@')[0];
      let resolvedRole: any = 'spectator';
      if (['organizer', 'volunteer', 'security', 'medical', 'admin'].includes(username)) {
        resolvedRole = username;
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

  async createUserWithEmailAndPassword(email: string, displayName: string, role: string): Promise<EmulatedUser> {
    const users = JSON.parse(localStorage.getItem('arenamind_db_users') || '[]');
    if (users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already in use');
    }

    const newUser: EmulatedUser = {
      uid: `uid_${Math.random().toString(36).substr(2, 9)}`,
      email,
      displayName,
      role: role as any,
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
    const idx = users.findIndex((u: any) => u.uid === this.currentUser?.uid);
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
      const defaultUsers = [
        { email: 'spectator@arenamind.ai', displayName: 'Sam Spectator', role: 'spectator', uid: 's1' },
        { email: 'organizer@arenamind.ai', displayName: 'Olivia Organizer', role: 'organizer', uid: 'o1' },
        { email: 'volunteer@arenamind.ai', displayName: 'Vince Volunteer', role: 'volunteer', uid: 'v1' },
        { email: 'security@arenamind.ai', displayName: 'Steve Security', role: 'security', uid: 'sec1' },
        { email: 'medical@arenamind.ai', displayName: 'Molly Medical', role: 'medical', uid: 'med1' },
        { email: 'admin@arenamind.ai', displayName: 'Alice Admin', role: 'admin', uid: 'a1' },
      ];
      localStorage.setItem('arenamind_db_users', JSON.stringify(defaultUsers));
    }

    // Seed matches
    if (!localStorage.getItem('arenamind_db_matches')) {
      const defaultMatches = [
        {
          id: 'match-1',
          teams: { home: 'Indias', away: 'Australia', homeLogo: '🇮🇳', awayLogo: '🇦🇺' },
          sport: 'Cricket',
          status: 'live',
          startTime: '19:00',
          scores: { home: 184, away: 162 },
          venue: 'ArenaMind Mega Stadium',
          spectatorCount: 68420,
          gateStatus: { 'Gate A': 'open', 'Gate B': 'open', 'Gate C': 'restricted', 'Gate D': 'open' }
        },
        {
          id: 'match-2',
          teams: { home: 'Real Madrid', away: 'Manchester City', homeLogo: '🇪🇸', awayLogo: '🇬🇧' },
          sport: 'Football',
          status: 'scheduled',
          startTime: 'Tomorrow, 21:00',
          scores: { home: 0, away: 0 },
          venue: 'ArenaMind Football Colosseum',
          spectatorCount: 0,
          gateStatus: { 'Gate A': 'open', 'Gate B': 'open', 'Gate C': 'open', 'Gate D': 'open' }
        }
      ];
      localStorage.setItem('arenamind_db_matches', JSON.stringify(defaultMatches));
    }

    // Seed gates
    if (!localStorage.getItem('arenamind_db_gates')) {
      const defaultGates = [
        { id: 'gate-a', name: 'Gate A', status: 'open', capacity: 15000, currentFlow: 140, queueLength: 85, waitTime: 4 },
        { id: 'gate-b', name: 'Gate B', status: 'open', capacity: 12000, currentFlow: 230, queueLength: 320, waitTime: 22 },
        { id: 'gate-c', name: 'Gate C', status: 'restricted', capacity: 8000, currentFlow: 45, queueLength: 12, waitTime: 2 },
        { id: 'gate-d', name: 'Gate D', status: 'open', capacity: 14000, currentFlow: 90, queueLength: 45, waitTime: 3 },
        { id: 'gate-e', name: 'Gate E (VVIP)', status: 'open', capacity: 3000, currentFlow: 15, queueLength: 4, waitTime: 1 },
      ];
      localStorage.setItem('arenamind_db_gates', JSON.stringify(defaultGates));
    }

    // Seed facilities (Food courts, restrooms)
    if (!localStorage.getItem('arenamind_db_facilities')) {
      const defaultFacilities = [
        { id: 'fac-rc1', type: 'restroom', name: 'Restroom Block 1 (North)', location: 'North Tier 1', status: 'active', occupancy: 40, waitTime: 2, accessible: true, cleaningStatus: 'Clean' },
        { id: 'fac-rc2', type: 'restroom', name: 'Restroom Block 2 (East)', location: 'East Tier 2', status: 'cleaning', occupancy: 100, waitTime: 15, accessible: true, cleaningStatus: 'In Progress' },
        { id: 'fac-rc3', type: 'restroom', name: 'Restroom Block 3 (South)', location: 'South Tier 1', status: 'active', occupancy: 85, waitTime: 7, accessible: false, cleaningStatus: 'Clean' },
        { id: 'fac-fc1', type: 'food_court', name: 'Grand Food Bazaar', location: 'West concourse', status: 'active', occupancy: 90, waitTime: 18, items: ['Burgers', 'Pizza', 'Samosas', 'Biryani'] },
        { id: 'fac-fc2', type: 'food_court', name: 'Arena Express Cafe', location: 'East concourse', status: 'active', occupancy: 35, waitTime: 4, items: ['Coffee', 'Sandwiches', 'Popcorn'] },
        { id: 'fac-fc3', type: 'food_court', name: 'Healthy Corner', location: 'North concourse', status: 'active', occupancy: 20, waitTime: 2, items: ['Salads', 'Smoothies', 'Juice'] },
      ];
      localStorage.setItem('arenamind_db_facilities', JSON.stringify(defaultFacilities));
    }

    // Seed parking
    if (!localStorage.getItem('arenamind_db_parking')) {
      const defaultParking = [
        { id: 'park-a', zone: 'Zone A (North)', spotsAvailable: 140, totalSpots: 1000, walkingTime: 5, status: 'almost_full' },
        { id: 'park-b', zone: 'Zone B (East)', spotsAvailable: 580, totalSpots: 1200, walkingTime: 8, status: 'available' },
        { id: 'park-c', zone: 'Zone C (West)', spotsAvailable: 15, totalSpots: 800, walkingTime: 6, status: 'full' },
        { id: 'park-d', zone: 'Zone D (South)', spotsAvailable: 450, totalSpots: 900, walkingTime: 11, status: 'available' },
      ];
      localStorage.setItem('arenamind_db_parking', JSON.stringify(defaultParking));
    }

    // Seed alerts
    if (!localStorage.getItem('arenamind_db_alerts')) {
      const defaultAlerts = [
        { id: 'alert-1', type: 'crowd', severity: 'high', location: 'Gate B Entrance', description: 'Crowd build-up exceeding 250 people/minute. Queue time elevated to 22 minutes.', status: 'active', timestamp: new Date(Date.now() - 600000).toISOString() },
        { id: 'alert-2', type: 'medical', severity: 'critical', location: 'Row F, Seat 42 (Tier 1)', description: 'Spectator reported severe chest pains. Medical Responder Team B dispatched.', status: 'active', timestamp: new Date(Date.now() - 300000).toISOString() },
        { id: 'alert-3', type: 'security', severity: 'medium', location: 'Parking Zone C', description: 'Minor traffic fender-bender causing blockages at Zone C entrance.', status: 'active', timestamp: new Date().toISOString() },
      ];
      localStorage.setItem('arenamind_db_alerts', JSON.stringify(defaultAlerts));
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

    // Role-based Access Control (RBAC) constraints
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

    const currentData = emulatedDb.getData(collectionName);
    const updated = currentData.map((item: any) => {
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

    // Spectators are only permitted to submit reports/incident alerts
    if (userRole === 'spectator' && collectionName !== 'alerts') {
      throw new Error(`Unauthorized: Spectators can only create support alerts.`);
    }

    if (collectionName === 'matches' && !['organizer', 'admin'].includes(userRole)) {
      throw new Error(`Unauthorized: Role '${userRole}' cannot create matches.`);
    }

    if (collectionName === 'gates' && !['organizer', 'admin', 'security'].includes(userRole)) {
      throw new Error(`Unauthorized: Role '${userRole}' cannot create gate records.`);
    }

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
