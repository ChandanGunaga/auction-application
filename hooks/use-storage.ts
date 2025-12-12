'use client';

import { useState, useEffect, useCallback } from 'react';
import { storage, migrateFromLocalStorage } from '@/lib/storage';
import { Player, Team, AuctionState } from '@/types/auction';

// Hook to handle async storage initialization
export function useStorageInit() {
  const [isReady, setIsReady] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    async function init() {
      setIsMigrating(true);
      await migrateFromLocalStorage();
      setIsMigrating(false);
      setIsReady(true);
    }
    init();
  }, []);

  return { isReady, isMigrating };
}

// Hook for teams data
export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const { isReady } = useStorageInit();

  const loadTeams = useCallback(async () => {
    if (!isReady) return;
    setLoading(true);
    const data = await storage.getTeams();
    setTeams(data);
    setLoading(false);
  }, [isReady]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const saveTeams = useCallback(async (newTeams: Team[]) => {
    await storage.saveTeams(newTeams);
    setTeams(newTeams);
  }, []);

  const addTeam = useCallback(async (team: Team) => {
    const newTeams = [...teams, team];
    await saveTeams(newTeams);
  }, [teams, saveTeams]);

  const updateTeam = useCallback(async (updatedTeam: Team) => {
    const newTeams = teams.map(t => t.id === updatedTeam.id ? updatedTeam : t);
    await saveTeams(newTeams);
  }, [teams, saveTeams]);

  const deleteTeam = useCallback(async (id: string) => {
    const newTeams = teams.filter(t => t.id !== id);
    await saveTeams(newTeams);
  }, [teams, saveTeams]);

  return { teams, loading, saveTeams, addTeam, updateTeam, deleteTeam, reload: loadTeams };
}

// Hook for players data
export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const { isReady } = useStorageInit();

  const loadPlayers = useCallback(async () => {
    if (!isReady) return;
    setLoading(true);
    const data = await storage.getPlayers();
    setPlayers(data);
    setLoading(false);
  }, [isReady]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const savePlayers = useCallback(async (newPlayers: Player[]) => {
    await storage.savePlayers(newPlayers);
    setPlayers(newPlayers);
  }, []);

  const addPlayer = useCallback(async (player: Player) => {
    const newPlayers = [...players, player];
    await savePlayers(newPlayers);
  }, [players, savePlayers]);

  const updatePlayer = useCallback(async (updatedPlayer: Player) => {
    const newPlayers = players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
    await savePlayers(newPlayers);
  }, [players, savePlayers]);

  const deletePlayer = useCallback(async (id: string) => {
    const newPlayers = players.filter(p => p.id !== id);
    await savePlayers(newPlayers);
  }, [players, savePlayers]);

  return { players, loading, savePlayers, addPlayer, updatePlayer, deletePlayer, reload: loadPlayers };
}

// Hook for auction state
export function useAuctionState() {
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [loading, setLoading] = useState(true);
  const { isReady } = useStorageInit();

  const loadState = useCallback(async () => {
    if (!isReady) return;
    setLoading(true);
    const state = await storage.getAuctionState();
    setAuctionState(state);
    setLoading(false);
  }, [isReady]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const saveState = useCallback(async (state: AuctionState) => {
    await storage.saveAuctionState(state);
    setAuctionState(state);
  }, []);

  return { auctionState, loading, saveState, reload: loadState };
}

// Hook for storage stats (home page)
export function useStorageStats() {
  const [stats, setStats] = useState({ teams: 0, players: 0, hasAuction: false });
  const [loading, setLoading] = useState(true);
  const { isReady } = useStorageInit();

  const loadStats = useCallback(async () => {
    if (!isReady) return;
    setLoading(true);
    const data = await storage.getStats();
    setStats(data);
    setLoading(false);
  }, [isReady]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, reload: loadStats };
}

// Hook for clearing all data
export function useClearStorage() {
  const clearAll = useCallback(async () => {
    await storage.clearAll();
  }, []);

  return { clearAll };
}
