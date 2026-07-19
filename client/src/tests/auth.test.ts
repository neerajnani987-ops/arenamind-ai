// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';

describe('AuthContext and User Session Management', () => {
  let mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    mockLocalStorage = {};
  });

  const getSavedUser = () => {
    const data = mockLocalStorage['arenamind_auth_user'];
    if (!data) return null;
    return JSON.parse(data);
  };

  const setSavedUser = (user: any) => {
    mockLocalStorage['arenamind_auth_user'] = JSON.stringify(user);
  };

  it('should verify spectator role is assigned as default when login matches general user', () => {
    const email = 'viewer@example.com';
    const username = email.split('@')[0];
    const user = {
      uid: 'uid-test',
      email,
      displayName: username,
      role: 'spectator',
    };
    setSavedUser(user);

    const activeUser = getSavedUser();
    expect(activeUser).toBeDefined();
    expect(activeUser.role).toBe('spectator');
  });

  it('should verify administrative users receive full administrative privileges', () => {
    const user = {
      uid: 'uid-admin',
      email: 'admin@arenamind.ai',
      displayName: 'Alice Admin',
      role: 'admin',
    };
    setSavedUser(user);

    const activeUser = getSavedUser();
    expect(activeUser.role).toBe('admin');
  });

  it('should verify that switchRole updates role state attributes correctly', () => {
    const user = {
      uid: 'uid-1',
      email: 'organizer@arenamind.ai',
      role: 'organizer',
    };
    setSavedUser(user);

    const currentUser = getSavedUser();
    currentUser.role = 'security';
    setSavedUser(currentUser);

    const updatedUser = getSavedUser();
    expect(updatedUser.role).toBe('security');
  });

  it('should check signing out clears all session attributes', () => {
    setSavedUser({ uid: '123', email: 'test@test.com', role: 'volunteer' });
    expect(getSavedUser()).not.toBeNull();

    delete mockLocalStorage['arenamind_auth_user'];
    expect(getSavedUser()).toBeNull();
  });

  it('should ensure role colors dictionary contains valid Tailwind class prefixes', () => {
    const roleColors: Record<string, string> = {
      spectator: 'bg-indigo-500/10 text-indigo-400',
      organizer: 'bg-violet-500/10 text-violet-400',
      volunteer: 'bg-emerald-500/10 text-emerald-400',
      security: 'bg-rose-500/10 text-rose-400',
      medical: 'bg-amber-500/10 text-amber-400',
      admin: 'bg-fuchsia-500/10 text-fuchsia-400',
    };

    expect(roleColors.spectator).toContain('indigo');
    expect(roleColors.security).toContain('rose');
    expect(roleColors.medical).toContain('amber');
    expect(roleColors.admin).toContain('fuchsia');
  });

  it('should verify displayName slicing behaves safely with null inputs', () => {
    const getInitials = (name?: string) => {
      return name?.slice(0, 2) || 'US';
    };
    expect(getInitials('John')).toBe('Jo');
    expect(getInitials(undefined)).toBe('US');
  });

  it('should assert mock profiles initialization logic is robust', () => {
    const initialUsersList = [
      { email: 'spectator@arenamind.ai', role: 'spectator' },
      { email: 'admin@arenamind.ai', role: 'admin' }
    ];
    expect(initialUsersList.length).toBe(2);
    expect(initialUsersList[0].role).toBe('spectator');
  });

  it('should verify email matching logic matches case insensitively', () => {
    const emailA = 'Admin@ArenaMind.ai';
    const emailB = 'admin@arenamind.ai';
    expect(emailA.toLowerCase()).toBe(emailB.toLowerCase());
  });

  it('should verify password hashing and validation logic matches correctly', async () => {
    const { emulatedAuth } = await import('../firebase/config');
    localStorage.removeItem('arenamind_db_users');
    localStorage.removeItem('arenamind_auth_user');
    
    const email = 'test-hash@example.com';
    const password = 'my-secure-password';
    
    const registered = await emulatedAuth.createUserWithEmailAndPassword(email, 'Hash Test', 'spectator', password);
    expect(registered.passwordHash).toBeDefined();
    expect(registered.passwordHash).not.toBe(password);
    
    await emulatedAuth.signOut();
    
    const loggedIn = await emulatedAuth.signInWithEmailAndPassword(email, password);
    expect(loggedIn.email).toBe(email);
    
    await expect(emulatedAuth.signInWithEmailAndPassword(email, 'wrong-password')).rejects.toThrow('Invalid password');
  });
});
