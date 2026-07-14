import type { Ticket, Match, Gate, Facility, ParkingZone, Alert } from '../types';

/**
 * Interface for ticket records excluding detailed route nodes mapping structures.
 */
export interface MockTicket extends Omit<Ticket, 'routeDetails'> {
  gateName: string;
  routeDetails: {
    path: string[];
    coordinates: [number, number][];
    directions: string[];
    estimatedTimeMin: number;
    wheelchair: boolean;
  };
}

/**
 * Array of languages supported by ArenaMind speech recognition and translator modules.
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'english', label: 'English' },
  { code: 'hindi', label: 'Hindi (हिन्दी)' },
  { code: 'telugu', label: 'Telugu (తెలుగు)' },
  { code: 'tamil', label: 'Tamil (தமிழ்)' },
  { code: 'kannada', label: 'Kannada (ಕನ್ನಡ)' }
];

/**
 * Maps language names to browser-specific locale identification codes (BCP 47 tags).
 */
export const LANG_BCP47_MAP: Record<string, string> = {
  english: 'en-US',
  hindi: 'hi-IN',
  telugu: 'te-IN',
  tamil: 'ta-IN',
  kannada: 'kn-IN',
};

/**
 * Default simulated users configuration list.
 */
export const DEFAULT_USERS = [
  { email: 'spectator@arenamind.ai', displayName: 'Sam Spectator', role: 'spectator', uid: 's1' },
  { email: 'organizer@arenamind.ai', displayName: 'Olivia Organizer', role: 'organizer', uid: 'o1' },
  { email: 'volunteer@arenamind.ai', displayName: 'Vince Volunteer', role: 'volunteer', uid: 'v1' },
  { email: 'security@arenamind.ai', displayName: 'Steve Security', role: 'security', uid: 'sec1' },
  { email: 'medical@arenamind.ai', displayName: 'Molly Medical', role: 'medical', uid: 'med1' },
  { email: 'admin@arenamind.ai', displayName: 'Alice Admin', role: 'admin', uid: 'a1' },
];

/**
 * Default match telemetry schedules.
 */
export const DEFAULT_MATCHES: Match[] = [
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

/**
 * Default stadium gate parameters.
 */
export const DEFAULT_GATES: Gate[] = [
  { id: 'gate-a', name: 'Gate A', status: 'open', capacity: 15000, currentFlow: 140, queueLength: 85, waitTime: 4 },
  { id: 'gate-b', name: 'Gate B', status: 'open', capacity: 12000, currentFlow: 230, queueLength: 320, waitTime: 22 },
  { id: 'gate-c', name: 'Gate C', status: 'restricted', capacity: 8000, currentFlow: 45, queueLength: 12, waitTime: 2 },
  { id: 'gate-d', name: 'Gate D', status: 'open', capacity: 14000, currentFlow: 90, queueLength: 45, waitTime: 3 },
  { id: 'gate-e', name: 'Gate E (VVIP)', status: 'open', capacity: 3000, currentFlow: 15, queueLength: 4, waitTime: 1 },
];

/**
 * Default corridor facilities and food concession wait queues.
 */
export const DEFAULT_FACILITIES: Facility[] = [
  { id: 'fac-rc1', type: 'restroom', name: 'Restroom Block 1 (North)', location: 'North Tier 1', status: 'active', occupancy: 40, waitTime: 2, accessible: true, cleaningStatus: 'Clean' },
  { id: 'fac-rc2', type: 'restroom', name: 'Restroom Block 2 (East)', location: 'East Tier 2', status: 'cleaning', occupancy: 100, waitTime: 15, accessible: true, cleaningStatus: 'In Progress' },
  { id: 'fac-rc3', type: 'restroom', name: 'Restroom Block 3 (South)', location: 'South Tier 1', status: 'active', occupancy: 85, waitTime: 7, accessible: false, cleaningStatus: 'Clean' },
  { id: 'fac-fc1', type: 'food_court', name: 'Grand Food Bazaar', location: 'West concourse', status: 'active', occupancy: 90, waitTime: 18, items: ['Burgers', 'Pizza', 'Samosas', 'Biryani'] },
  { id: 'fac-fc2', type: 'food_court', name: 'Arena Express Cafe', location: 'East concourse', status: 'active', occupancy: 35, waitTime: 4, items: ['Coffee', 'Sandwiches', 'Popcorn'] },
  { id: 'fac-fc3', type: 'food_court', name: 'Healthy Corner', location: 'North concourse', status: 'active', occupancy: 20, waitTime: 2, items: ['Salads', 'Smoothies', 'Juice'] },
];

/**
 * Default parking spaces and walking ranges.
 */
export const DEFAULT_PARKING: ParkingZone[] = [
  { id: 'park-a', zone: 'Zone A (North)', spotsAvailable: 140, totalSpots: 1000, walkingTime: 5, status: 'almost_full' },
  { id: 'park-b', zone: 'Zone B (East)', spotsAvailable: 580, totalSpots: 1200, walkingTime: 8, status: 'available' },
  { id: 'park-c', zone: 'Zone C (West)', spotsAvailable: 15, totalSpots: 800, walkingTime: 6, status: 'full' },
  { id: 'park-d', zone: 'Zone D (South)', spotsAvailable: 450, totalSpots: 900, walkingTime: 11, status: 'available' },
];

/**
 * Default emergency warning logs.
 */
export const DEFAULT_ALERTS: Alert[] = [
  { id: 'alert-1', type: 'crowd', severity: 'high', location: 'Gate B Entrance', description: 'Crowd build-up exceeding 250 people/minute. Queue time elevated to 22 minutes.', status: 'active', timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 'alert-2', type: 'medical', severity: 'critical', location: 'Row F, Seat 42 (Tier 1)', description: 'Spectator reported severe chest pains. Medical Responder Team B dispatched.', status: 'active', timestamp: new Date(Date.now() - 300000).toISOString() },
  { id: 'alert-3', type: 'security', severity: 'medium', location: 'Parking Zone C', description: 'Minor traffic fender-bender causing blockages at Zone C entrance.', status: 'active', timestamp: new Date().toISOString() },
];

/**
 * Preset data for ticket verification emulation scanner.
 */
export const mockTickets: MockTicket[] = [
  {
    ticketId: "TKT-FIFA-2026-A120",
    holderName: "Sam Spectator",
    seat: "Seat A-120",
    tier: "Lower Tier 1 Concourse",
    gate: "gate-a",
    gateName: "Gate A (North)",
    parkingZone: "Zone A (North)",
    routeDetails: {
      path: ["Gate A (North)", "Lower Tier 1 Concourse", "Seat A-120 (Tier 1)"],
      coordinates: [
        [12.9780, 77.5910],
        [12.9778, 77.5912],
        [12.9776, 77.5914]
      ],
      directions: [
        "Scan ticket at Gate A barcode reader.",
        "Walk straight through the north concourse entry point.",
        "Seat A-120 is 30 meters ahead in Section A, Row 12."
      ],
      estimatedTimeMin: 2,
      wheelchair: true
    }
  },
  {
    ticketId: "TKT-FIFA-2026-VIP7",
    holderName: "Olivia Organizer",
    seat: "VIP Lounge Sector 5",
    tier: "Middle Tier 2 Concourse",
    gate: "gate-e",
    gateName: "Gate E (VVIP)",
    parkingZone: "Zone A (North)",
    routeDetails: {
      path: ["Gate E (VVIP)", "Middle Tier 2 Concourse", "VIP Lounge Sector 5"],
      coordinates: [
        [12.9790, 77.5915],
        [12.9782, 77.5915],
        [12.9783, 77.5922]
      ],
      directions: [
        "Enter through the exclusive VVIP gate lobby.",
        "Take elevator 3 to Level 2.",
        "VIP Lounge is directly on your right."
      ],
      estimatedTimeMin: 1,
      wheelchair: true
    }
  }
];
