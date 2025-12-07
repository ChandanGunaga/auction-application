import { AuctionState, Team, Player } from '@/types/auction';

const STORAGE_KEYS = {
  TEAMS: 'auction_teams',
  PLAYERS: 'auction_players',
  AUCTION_STATE: 'auction_state',
};

export const storage = {
  saveTeams: (teams: Team[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    }
  },

  getTeams: (): Team[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.TEAMS);
    return data ? JSON.parse(data) : [];
  },

  savePlayers: (players: Player[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    }
  },

  getPlayers: (): Player[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    return data ? JSON.parse(data) : [];
  },

  saveAuctionState: (state: AuctionState) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AUCTION_STATE, JSON.stringify(state));
    }
  },

  getAuctionState: (): AuctionState | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(STORAGE_KEYS.AUCTION_STATE);
    return data ? JSON.parse(data) : null;
  },

  clearAll: () => {
    if (typeof window !== 'undefined') {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    }
  },
};
