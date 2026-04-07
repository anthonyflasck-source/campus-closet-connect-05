import { SEED_USERS, SEED_MESSAGES, generateSeedImages, createSeedListings } from './seedData';
import type { User, Listing, Message } from './seedData';

const KEYS = {
  users: 'cc_users',
  listings: 'cc_listings',
  messages: 'cc_messages',
  currentUser: 'cc_current_user',
  seeded: 'cc_seeded',
};

export function initStore() {
  const SEED_VERSION = '3';
  if (localStorage.getItem(KEYS.seeded) !== SEED_VERSION) {
    const images = generateSeedImages();
    const listings = createSeedListings(images);
    localStorage.setItem(KEYS.users, JSON.stringify(SEED_USERS));
    localStorage.setItem(KEYS.listings, JSON.stringify(listings));
    localStorage.setItem(KEYS.messages, JSON.stringify(SEED_MESSAGES));
    localStorage.setItem(KEYS.seeded, SEED_VERSION);
  }
}

function getAll<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function saveAll<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getUsers(): User[] { return getAll<User>(KEYS.users); }
export function getUserById(id: string): User | null { return getUsers().find(u => u.id === id) || null; }

export function getCurrentUser(): User | null {
  try {
    const val = localStorage.getItem(KEYS.currentUser);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

export function login(email: string, password: string) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    localStorage.setItem(KEYS.currentUser, JSON.stringify(user));
    return { success: true as const, user };
  }
  return { success: false as const, error: 'Invalid email or password' };
}

export function signup(name: string, email: string, password: string) {
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    return { success: false as const, error: 'An account with this email already exists' };
  }
  const newUser: User = {
    id: 'user-' + Date.now(),
    name, email, password,
    school: 'Campus University',
    joined: new Date().toISOString().slice(0, 10),
  };
  users.push(newUser);
  saveAll(KEYS.users, users);
  localStorage.setItem(KEYS.currentUser, JSON.stringify(newUser));
  return { success: true as const, user: newUser };
}

export function logout() { localStorage.removeItem(KEYS.currentUser); }

export function getListings(): Listing[] { return getAll<Listing>(KEYS.listings); }
export function getListingById(id: string): Listing | null { return getListings().find(l => l.id === id) || null; }
export function getListingsByUser(userId: string): Listing[] { return getListings().filter(l => l.userId === userId); }

export function addListing(listing: Omit<Listing, 'id' | 'createdAt'>): Listing {
  const listings = getListings();
  const newListing: Listing = { ...listing, id: 'listing-' + Date.now(), createdAt: new Date().toISOString() };
  listings.unshift(newListing);
  saveAll(KEYS.listings, listings);
  return newListing;
}

export function deleteListing(id: string) {
  const listings = getListings().filter(l => l.id !== id);
  saveAll(KEYS.listings, listings);
}

export function getMessagesForUser(userId: string) {
  const msgs = getAll<Message>(KEYS.messages);
  return {
    received: msgs.filter(m => m.toUserId === userId),
    sent: msgs.filter(m => m.fromUserId === userId),
  };
}

export function sendMessage(fromUserId: string, toUserId: string, listingId: string, message: string) {
  const messages = getAll<Message>(KEYS.messages);
  const newMsg: Message = {
    id: 'msg-' + Date.now(), fromUserId, toUserId, listingId, message,
    createdAt: new Date().toISOString(),
  };
  messages.push(newMsg);
  saveAll(KEYS.messages, messages);
  return newMsg;
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

export type { User, Listing, Message };
