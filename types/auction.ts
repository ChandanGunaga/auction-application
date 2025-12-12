export interface Player {
  id: string;
  name: string;
  basePrice: number;
  category?: string;
  role?: string;
  skills?: string[];
  status: 'available' | 'sold' | 'unsold' | 'passed';
  currentPrice?: number;
  teamId?: string;
  intro?: string;
  photoUrl?: string;
  photoFile?: string; // base64 encoded image data
}

export interface Team {
  id: string;
  name: string;
  color: string;
  budget: number;
  remainingBudget: number;
  players: Player[];
  logoUrl?: string;
  logoFile?: string; // base64 encoded logo image
}

export interface AuctionState {
  teams: Team[];
  players: Player[];
  currentPlayerIndex: number;
  auctionStarted: boolean;
  auctionCompleted: boolean;
  history: HistoryEntry[];
}

export interface HistoryEntry {
  playerId: string;
  playerName: string;
  action: 'sold' | 'unsold' | 'passed';
  teamId?: string;
  teamName?: string;
  price?: number;
  timestamp: number;
}

export interface BidIncrement {
  min: number;
  max: number;
  increment: number;
}
