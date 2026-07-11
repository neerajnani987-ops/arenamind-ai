// Centralized Type Definitions for ArenaMind AI

export type UserRole = 'spectator' | 'organizer' | 'volunteer' | 'security' | 'medical' | 'admin';

export interface EmulatedUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  ticketInfo?: Ticket | null;
}

export interface RouteResult {
  path: string[];
  coordinates: [number, number][];
  directions: string[];
  estimatedTimeMin: number;
  wheelchair: boolean;
}

export interface Ticket {
  ticketId: string;
  holderName: string;
  seat: string;
  tier: string;
  gate: string;
  parkingZone: string;
  routeDetails: RouteResult;
}

export interface Match {
  id: string;
  teams: {
    home: string;
    away: string;
    homeLogo: string;
    awayLogo: string;
  };
  sport: string;
  status: 'scheduled' | 'live' | 'completed';
  startTime: string;
  scores: {
    home: number;
    away: number;
  };
  venue: string;
  spectatorCount: number;
  gateStatus: Record<string, 'open' | 'closed' | 'restricted'>;
}

export interface Gate {
  id: string;
  name: string;
  status: 'open' | 'closed' | 'restricted';
  capacity: number;
  currentFlow: number;
  queueLength: number;
  waitTime: number;
}

export interface Facility {
  id: string;
  type: 'restroom' | 'food_court' | 'parking';
  name: string;
  location: string;
  status: string;
  occupancy: number;
  waitTime: number;
  accessible?: boolean;
  cleaningStatus?: string;
  items?: string[];
}

export interface ParkingZone {
  id: string;
  zone: string;
  spotsAvailable: number;
  totalSpots: number;
  walkingTime: number;
  status: 'available' | 'almost_full' | 'full';
}

export interface AlertIncident {
  id: string;
  type: 'security' | 'medical' | 'crowd' | 'gate' | 'weather' | 'schedule';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  status: 'active' | 'resolved';
  timestamp: string;
  assignedTo?: string | null;
}

export type Alert = AlertIncident;

export interface PredictionResult {
  hourlyOccupancy: Array<{ hour: string; occupancy: number; risk: number; waitTimeGateB: number }>;
  recommendation: string;
  peakHour: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  resourceDemand: {
    volunteers: number;
    security: number;
    medicalTeams: number;
  };
}

export interface TranslationResult {
  translations: {
    english: string;
    telugu: string;
    hindi: string;
    tamil: string;
    kannada: string;
  };
  provider: string;
}

export interface AIAuditLog {
  timestamp: string;
  role: string;
  prompt: string;
  provider: 'gemini' | 'mock_local' | 'client_emulation';
  status: string;
}
