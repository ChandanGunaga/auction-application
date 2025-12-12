import Dexie, { Table } from 'dexie';
import { Player, Team, AuctionState, HistoryEntry } from '@/types/auction';

// Database schema
class AuctionDatabase extends Dexie {
  players!: Table<Player>;
  teams!: Table<Team>;
  auctionState!: Table<AuctionState & { id: string }>;

  constructor() {
    super('AuctionDB');

    this.version(1).stores({
      // Indexed fields for efficient queries
      players: 'id, status, teamId, category, name',
      teams: 'id, name',
      auctionState: 'id', // Single record with id='current'
    });
  }
}

// Singleton instance
export const db = new AuctionDatabase();

// Storage keys for localStorage migration
const LEGACY_STORAGE_KEYS = {
  TEAMS: 'auction_teams',
  PLAYERS: 'auction_players',
  AUCTION_STATE: 'auction_state',
};

// Check if migration is needed and perform it
export async function migrateFromLocalStorage(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    // Check if we already have data in IndexedDB
    const existingPlayers = await db.players.count();
    const existingTeams = await db.teams.count();

    if (existingPlayers > 0 || existingTeams > 0) {
      // Already migrated, clean up localStorage
      cleanupLocalStorage();
      return false;
    }

    // Check if there's data in localStorage to migrate
    const localTeams = localStorage.getItem(LEGACY_STORAGE_KEYS.TEAMS);
    const localPlayers = localStorage.getItem(LEGACY_STORAGE_KEYS.PLAYERS);
    const localState = localStorage.getItem(LEGACY_STORAGE_KEYS.AUCTION_STATE);

    if (!localTeams && !localPlayers && !localState) {
      return false; // Nothing to migrate
    }

    console.log('Migrating data from localStorage to IndexedDB...');

    // Migrate teams
    if (localTeams) {
      const teams: Team[] = JSON.parse(localTeams);
      if (teams.length > 0) {
        await db.teams.bulkPut(teams);
        console.log(`Migrated ${teams.length} teams`);
      }
    }

    // Migrate players
    if (localPlayers) {
      const players: Player[] = JSON.parse(localPlayers);
      if (players.length > 0) {
        await db.players.bulkPut(players);
        console.log(`Migrated ${players.length} players`);
      }
    }

    // Migrate auction state
    if (localState) {
      const state: AuctionState = JSON.parse(localState);
      await db.auctionState.put({ ...state, id: 'current' });
      console.log('Migrated auction state');
    }

    // Clean up localStorage after successful migration
    cleanupLocalStorage();
    console.log('Migration complete! localStorage data cleaned up.');

    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

function cleanupLocalStorage() {
  if (typeof window === 'undefined') return;

  Object.values(LEGACY_STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// Async storage API
export const dbStorage = {
  // Teams
  async saveTeams(teams: Team[]): Promise<void> {
    await db.transaction('rw', db.teams, async () => {
      await db.teams.clear();
      if (teams.length > 0) {
        await db.teams.bulkPut(teams);
      }
    });
  },

  async getTeams(): Promise<Team[]> {
    return await db.teams.toArray();
  },

  async getTeamById(id: string): Promise<Team | undefined> {
    return await db.teams.get(id);
  },

  async addTeam(team: Team): Promise<void> {
    await db.teams.put(team);
  },

  async updateTeam(team: Team): Promise<void> {
    await db.teams.put(team);
  },

  async deleteTeam(id: string): Promise<void> {
    await db.teams.delete(id);
  },

  // Players
  async savePlayers(players: Player[]): Promise<void> {
    await db.transaction('rw', db.players, async () => {
      await db.players.clear();
      if (players.length > 0) {
        await db.players.bulkPut(players);
      }
    });
  },

  async getPlayers(): Promise<Player[]> {
    return await db.players.toArray();
  },

  async getPlayerById(id: string): Promise<Player | undefined> {
    return await db.players.get(id);
  },

  async getPlayersByStatus(status: Player['status']): Promise<Player[]> {
    return await db.players.where('status').equals(status).toArray();
  },

  async getPlayersByTeam(teamId: string): Promise<Player[]> {
    return await db.players.where('teamId').equals(teamId).toArray();
  },

  async addPlayer(player: Player): Promise<void> {
    await db.players.put(player);
  },

  async updatePlayer(player: Player): Promise<void> {
    await db.players.put(player);
  },

  async deletePlayer(id: string): Promise<void> {
    await db.players.delete(id);
  },

  // Auction State
  async saveAuctionState(state: AuctionState): Promise<void> {
    await db.auctionState.put({ ...state, id: 'current' });
  },

  async getAuctionState(): Promise<AuctionState | null> {
    const state = await db.auctionState.get('current');
    if (!state) return null;
    // Remove the id field we added for storage
    const { id, ...auctionState } = state;
    return auctionState as AuctionState;
  },

  // Clear all data
  async clearAll(): Promise<void> {
    await db.transaction('rw', [db.teams, db.players, db.auctionState], async () => {
      await db.teams.clear();
      await db.players.clear();
      await db.auctionState.clear();
    });
  },

  // Utility: Get storage stats
  async getStats(): Promise<{ teams: number; players: number; hasAuction: boolean }> {
    const [teamsCount, playersCount, auctionState] = await Promise.all([
      db.teams.count(),
      db.players.count(),
      db.auctionState.get('current'),
    ]);

    return {
      teams: teamsCount,
      players: playersCount,
      hasAuction: !!auctionState,
    };
  },
};
