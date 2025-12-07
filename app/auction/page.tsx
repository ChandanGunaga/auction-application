'use client';

import { useState, useEffect } from 'react';
import { Player, Team, AuctionState, HistoryEntry } from '@/types/auction';
import { storage } from '@/lib/storage';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Play, Undo2, Home, CheckCircle, XCircle, SkipForward, Users, Trophy, AlertCircle, BarChart3, RotateCcw, ArrowRightLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AuctionPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [auctionStarted, setAuctionStarted] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferToTeam, setTransferToTeam] = useState('');
  const [transferPrice, setTransferPrice] = useState('');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newPlayerStatus, setNewPlayerStatus] = useState<'available' | 'sold' | 'unsold' | 'passed'>('available');
  const { toast } = useToast();

  const getPlayerInitials = (name: string) => {
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  useEffect(() => {
    const savedTeams = storage.getTeams();
    const savedPlayers = storage.getPlayers();
    const savedState = storage.getAuctionState();

    if (savedState) {
      setTeams(savedState.teams);
      setPlayers(savedState.players);
      setCurrentPlayerIndex(savedState.currentPlayerIndex);
      setHistory(savedState.history);
      setAuctionStarted(savedState.auctionStarted);
    } else {
      setTeams(savedTeams);
      setPlayers(savedPlayers.filter(p => p.status === 'available'));
    }
  }, []);

  const currentPlayer = players[currentPlayerIndex];
  const progress = players.length > 0 ? ((currentPlayerIndex + 1) / players.length) * 100 : 0;

  useEffect(() => {
    if (currentPlayer) {
      setCurrentPrice(currentPlayer.basePrice);
      setSelectedTeam('');
    }
  }, [currentPlayer]);

  const saveState = (updatedTeams: Team[], updatedPlayers: Player[], newHistory?: HistoryEntry[]) => {
    const state: AuctionState = {
      teams: updatedTeams,
      players: updatedPlayers,
      currentPlayerIndex,
      auctionStarted,
      auctionCompleted: currentPlayerIndex >= updatedPlayers.length - 1,
      history: newHistory || history,
    };
    storage.saveAuctionState(state);
    storage.saveTeams(updatedTeams);
    storage.savePlayers(updatedPlayers);
  };

  const startAuction = () => {
    if (teams.length === 0 || players.length === 0) {
      toast({
        title: "Cannot start auction",
        description: "Please add teams and players first!",
        variant: "destructive",
      });
      return;
    }
    setAuctionStarted(true);
    toast({
      title: "Auction started!",
      description: `${players.length} players ready for auction`,
    });
  };

  const handleSold = () => {
    if (!selectedTeam) {
      toast({
        title: "No team selected",
        description: "Please select a team before marking as sold",
        variant: "destructive",
      });
      return;
    }

    // Check if player is already sold
    if (currentPlayer.status === 'sold' && currentPlayer.teamId) {
      const existingTeam = teams.find(t => t.id === currentPlayer.teamId);
      toast({
        title: "Player already sold",
        description: `${currentPlayer.name} is already sold to ${existingTeam?.name || 'another team'}`,
        variant: "destructive",
      });
      return;
    }

    // Check if player already exists in any team
    const playerInTeam = teams.find(t => t.players.some(p => p.id === currentPlayer.id));
    if (playerInTeam) {
      toast({
        title: "Player already in a team",
        description: `${currentPlayer.name} is already in ${playerInTeam.name}`,
        variant: "destructive",
      });
      return;
    }

    const team = teams.find(t => t.id === selectedTeam);
    if (!team || team.remainingBudget < currentPrice) {
      toast({
        title: "Insufficient budget",
        description: `${team?.name} does not have enough budget for this bid`,
        variant: "destructive",
      });
      return;
    }

    const updatedPlayer: Player = { ...currentPlayer, status: 'sold', currentPrice, teamId: selectedTeam };
    const updatedPlayers = players.map(p => p.id === currentPlayer.id ? updatedPlayer : p);
    const updatedTeams = teams.map(t => t.id === selectedTeam ? {
      ...t,
      remainingBudget: t.remainingBudget - currentPrice,
      players: [...t.players, updatedPlayer],
    } : t);

    const historyEntry: HistoryEntry = {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      action: 'sold',
      teamId: selectedTeam,
      teamName: team.name,
      price: currentPrice,
      timestamp: Date.now(),
    };

    setTeams(updatedTeams);
    setPlayers(updatedPlayers);
    setHistory([historyEntry, ...history]);
    saveState(updatedTeams, updatedPlayers, [historyEntry, ...history]);

    toast({
      title: "Player sold!",
      description: `${currentPlayer.name} sold to ${team.name} for ${currentPrice.toLocaleString()} points`,
    });

    moveToNextPlayer();
  };

  const handleUnsold = () => {
    const updatedPlayer: Player = { ...currentPlayer, status: 'unsold' };
    const updatedPlayers = players.map(p => p.id === currentPlayer.id ? updatedPlayer : p);
    const historyEntry: HistoryEntry = {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      action: 'unsold',
      timestamp: Date.now(),
    };

    setPlayers(updatedPlayers);
    setHistory([historyEntry, ...history]);
    saveState(teams, updatedPlayers, [historyEntry, ...history]);

    toast({
      title: "Player unsold",
      description: `${currentPlayer.name} marked as unsold`,
    });

    moveToNextPlayer();
  };

  const handlePass = () => {
    const historyEntry: HistoryEntry = {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      action: 'passed',
      timestamp: Date.now(),
    };

    setHistory([historyEntry, ...history]);

    toast({
      title: "Player passed",
      description: `Skipped ${currentPlayer.name}`,
    });

    moveToNextPlayer();
  };

  const moveToNextPlayer = () => {
    setCurrentPlayerIndex(prev => prev + 1);
    setSelectedTeam('');
    setCustomAmount('');
  };

  const handleUndo = () => {
    if (history.length === 0) {
      toast({
        title: "Nothing to undo",
        description: "No previous actions to undo",
        variant: "destructive",
      });
      return;
    }

    const lastEntry = history[0];
    const updatedHistory = history.slice(1);
    let updatedPlayers = [...players];
    let updatedTeams = [...teams];

    if (lastEntry.action === 'sold') {
      updatedPlayers = players.map(p => p.id === lastEntry.playerId
        ? { ...p, status: 'available', currentPrice: undefined, teamId: undefined }
        : p
      );
      updatedTeams = teams.map(t => t.id === lastEntry.teamId ? {
        ...t,
        remainingBudget: t.remainingBudget + (lastEntry.price || 0),
        players: t.players.filter(p => p.id !== lastEntry.playerId),
      } : t);
    } else if (lastEntry.action === 'unsold') {
      updatedPlayers = players.map(p => p.id === lastEntry.playerId ? { ...p, status: 'available' } : p);
    }

    setPlayers(updatedPlayers);
    setTeams(updatedTeams);
    setHistory(updatedHistory);
    setCurrentPlayerIndex(prev => Math.max(0, prev - 1));
    saveState(updatedTeams, updatedPlayers, updatedHistory);

    toast({
      title: "Action undone",
      description: `Reverted ${lastEntry.action} for ${lastEntry.playerName}`,
    });
  };

  const incrementPrice = (amount: number) => {
    setCurrentPrice(prev => prev + amount);
  };

  const handleCustomIncrement = () => {
    const value = Number(customAmount);
    if (value > 0) {
      incrementPrice(value);
      setCustomAmount('');
    }
  };

  const resetToBasePrice = () => {
    setCurrentPrice(currentPlayer.basePrice);
    setSelectedTeam('');
    toast({
      title: "Price reset",
      description: `Reset to base price: ${currentPlayer.basePrice.toLocaleString()} points`,
    });
  };

  const handlePlayerSelect = (playerId: string) => {
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      setCurrentPlayerIndex(playerIndex);
      setSelectedTeam('');
      setCustomAmount('');
    }
  };

  const handleTransfer = () => {
    if (!transferToTeam) {
      toast({
        title: "No team selected",
        description: "Please select a team to transfer the player to",
        variant: "destructive",
      });
      return;
    }

    const price = transferPrice ? Number(transferPrice) : currentPlayer.currentPrice || currentPlayer.basePrice;
    const newTeam = teams.find(t => t.id === transferToTeam);

    if (!newTeam) {
      toast({
        title: "Team not found",
        description: "Selected team does not exist",
        variant: "destructive",
      });
      return;
    }

    if (newTeam.remainingBudget < price) {
      toast({
        title: "Insufficient budget",
        description: `${newTeam.name} does not have enough budget (${newTeam.remainingBudget.toLocaleString()} points available)`,
        variant: "destructive",
      });
      return;
    }

    // Remove player from current team if they have one
    let updatedTeams = [...teams];
    if (currentPlayer.teamId) {
      const oldTeam = teams.find(t => t.id === currentPlayer.teamId);
      updatedTeams = teams.map(t => {
        if (t.id === currentPlayer.teamId) {
          return {
            ...t,
            remainingBudget: t.remainingBudget + (currentPlayer.currentPrice || 0),
            players: t.players.filter(p => p.id !== currentPlayer.id),
          };
        }
        return t;
      });
    }

    // Add player to new team
    const updatedPlayer: Player = {
      ...currentPlayer,
      status: 'sold',
      currentPrice: price,
      teamId: transferToTeam
    };

    updatedTeams = updatedTeams.map(t => {
      if (t.id === transferToTeam) {
        return {
          ...t,
          remainingBudget: t.remainingBudget - price,
          players: [...t.players, updatedPlayer],
        };
      }
      return t;
    });

    const updatedPlayers = players.map(p => p.id === currentPlayer.id ? updatedPlayer : p);

    setTeams(updatedTeams);
    setPlayers(updatedPlayers);
    saveState(updatedTeams, updatedPlayers);

    const oldTeamName = currentPlayer.teamId
      ? teams.find(t => t.id === currentPlayer.teamId)?.name
      : 'None';

    toast({
      title: "Player transferred",
      description: `${currentPlayer.name} moved from ${oldTeamName} to ${newTeam.name} for ${price.toLocaleString()} points`,
    });

    setShowTransferDialog(false);
    setTransferToTeam('');
    setTransferPrice('');
  };

  const handleStatusChange = () => {
    let updatedTeams = [...teams];
    let updatedPlayer: Player = { ...currentPlayer, status: newPlayerStatus };

    // If changing to unsold, available, or passed - remove from team
    if (newPlayerStatus !== 'sold' && currentPlayer.teamId) {
      updatedTeams = teams.map(t => {
        if (t.id === currentPlayer.teamId) {
          return {
            ...t,
            remainingBudget: t.remainingBudget + (currentPlayer.currentPrice || 0),
            players: t.players.filter(p => p.id !== currentPlayer.id),
          };
        }
        return t;
      });
      updatedPlayer = {
        ...updatedPlayer,
        teamId: undefined,
        currentPrice: undefined,
      };
    }

    const updatedPlayers = players.map(p => p.id === currentPlayer.id ? updatedPlayer : p);

    setPlayers(updatedPlayers);
    setTeams(updatedTeams);
    saveState(updatedTeams, updatedPlayers);

    toast({
      title: "Status updated",
      description: `${currentPlayer.name} status changed to ${newPlayerStatus}`,
    });

    setShowStatusDialog(false);
  };

  // Pre-auction screen
  if (!auctionStarted) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster />
        <header className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Live Auction</h1>
                <p className="text-sm text-muted-foreground">Sports team auction system</p>
              </div>
              <Link href="/">
                <Button variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-10 h-10 text-primary-foreground" />
              </div>
              <CardTitle className="text-3xl">Ready to Start Auction?</CardTitle>
              <CardDescription className="text-base mt-2">
                Review your setup before beginning the auction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Teams</CardDescription>
                    <CardTitle className="text-3xl">{teams.length}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Trophy className="w-6 h-6 text-muted-foreground" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Players</CardDescription>
                    <CardTitle className="text-3xl">{players.length}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </CardContent>
                </Card>
              </div>

              {(teams.length === 0 || players.length === 0) && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Setup incomplete</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {teams.length === 0 && "Please add teams. "}
                      {players.length === 0 && "Please add players."}
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <Button
                  onClick={startAuction}
                  size="lg"
                  className="w-full"
                  disabled={teams.length === 0 || players.length === 0}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Auction
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/teams" className="w-full">
                    <Button variant="outline" size="lg" className="w-full">
                      <Trophy className="w-4 h-4 mr-2" />
                      Teams
                    </Button>
                  </Link>
                  <Link href="/players" className="w-full">
                    <Button variant="outline" size="lg" className="w-full">
                      <Users className="w-4 h-4 mr-2" />
                      Players
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Auction complete screen - only shown when user explicitly ends auction
  if (auctionEnded) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster />
        <header className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Auction Complete</h1>
                <p className="text-sm text-muted-foreground">Auction has been finished</p>
              </div>
              <Link href="/">
                <Button variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-3xl">Auction Complete!</CardTitle>
              <CardDescription className="text-base mt-2">
                {players.length} players processed across {teams.length} teams
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/results">
                <Button size="lg" className="w-full">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  View Results
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="lg" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Main auction screen
  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      {/* Header */}
      <header className="border-b print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-base px-3 py-1">
                Player {currentPlayerIndex + 1} of {players.length}
              </Badge>
              <Progress value={progress} className="w-32" />
            </div>

            <div className="flex items-center gap-3 flex-1 max-w-md">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">Select Player:</Label>
              <Select value={currentPlayer.id} onValueChange={handlePlayerSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a player" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((player, idx) => (
                    <SelectItem key={player.id} value={player.id}>
                      #{idx + 1} - {player.name} {player.status !== 'available' && `(${player.status})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleUndo} disabled={history.length === 0}>
                <Undo2 className="w-4 h-4 mr-2" />
                Undo
              </Button>
              <Button variant="destructive" onClick={() => setAuctionEnded(true)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                End Auction
              </Button>
              <Link href="/">
                <Button variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Exit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* All Players Processed Banner */}
        {currentPlayerIndex >= players.length && (
          <Card className="mb-6 border-green-500 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">All Players Processed</h3>
                    <p className="text-sm text-green-700">
                      You've gone through all {players.length} players. Click "End Auction" when ready to finish.
                    </p>
                  </div>
                </div>
                <Button size="lg" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => setAuctionEnded(true)}>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  End Auction
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Player Card */}
        {currentPlayer ? (
          <Card className="mb-6">
            <CardContent className="p-8">
              {/* Already Sold Warning */}
              {currentPlayer.status === 'sold' && currentPlayer.teamId && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-900">Player Already Sold</p>
                    <p className="text-sm text-yellow-700">
                      {currentPlayer.name} is already in {teams.find(t => t.id === currentPlayer.teamId)?.name || 'another team'} for {currentPlayer.currentPrice?.toLocaleString()} points
                    </p>
                  </div>
                </div>
              )}

              {/* Player Info */}
              <div className="text-center mb-6">
                {/* Player Photo */}
                <div className="flex justify-center mb-6">
                  {currentPlayer.photoUrl ? (
                    <img
                      src={currentPlayer.photoUrl}
                      alt={currentPlayer.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg"
                    />
                  ) : currentPlayer.photoFile ? (
                    <img
                      src={currentPlayer.photoFile}
                      alt={currentPlayer.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-4xl font-bold shadow-lg">
                      {getPlayerInitials(currentPlayer.name)}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 mb-4">
                  {currentPlayer.category && (
                    <Badge className="mb-3">{currentPlayer.category}</Badge>
                  )}
                  {currentPlayer.status === 'sold' && (
                    <Badge variant="destructive" className="mb-3 ml-2">SOLD</Badge>
                  )}
                  {currentPlayer.status === 'unsold' && (
                    <Badge variant="secondary" className="mb-3 ml-2">UNSOLD</Badge>
                  )}

                  {/* Transfer Button */}
                  <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="ml-4">
                        <ArrowRightLeft className="w-4 h-4 mr-1" />
                        Transfer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Transfer {currentPlayer.name}</DialogTitle>
                        <DialogDescription>
                          Move this player to a different team or assign to a team
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Current Team</Label>
                          <Input
                            value={currentPlayer.teamId ? teams.find(t => t.id === currentPlayer.teamId)?.name || 'None' : 'None'}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Transfer To</Label>
                          <Select value={transferToTeam} onValueChange={setTransferToTeam}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team" />
                            </SelectTrigger>
                            <SelectContent>
                              {teams.filter(t => t.id !== currentPlayer.teamId).map(team => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name} ({team.remainingBudget.toLocaleString()} points available)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Price (optional)</Label>
                          <Input
                            type="number"
                            placeholder={`Current: ${(currentPlayer.currentPrice || currentPlayer.basePrice).toLocaleString()} points`}
                            value={transferPrice}
                            onChange={(e) => setTransferPrice(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Leave empty to use current price: {(currentPlayer.currentPrice || currentPlayer.basePrice).toLocaleString()} points
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <Button onClick={handleTransfer} className="flex-1">
                            <ArrowRightLeft className="w-4 h-4 mr-2" />
                            Transfer
                          </Button>
                          <Button variant="outline" onClick={() => {
                            setShowTransferDialog(false);
                            setTransferToTeam('');
                            setTransferPrice('');
                          }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Change Status Button */}
                  <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="ml-2">
                        Change Status
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Status for {currentPlayer.name}</DialogTitle>
                        <DialogDescription>
                          Manually change the player's auction status
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Current Status</Label>
                          <Input
                            value={currentPlayer.status}
                            disabled
                            className="bg-muted capitalize"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>New Status</Label>
                          <Select value={newPlayerStatus} onValueChange={(value: any) => setNewPlayerStatus(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select new status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="sold">Sold</SelectItem>
                              <SelectItem value="unsold">Unsold</SelectItem>
                              <SelectItem value="passed">Passed</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Note: Changing from 'sold' will remove player from team
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <Button onClick={handleStatusChange} className="flex-1">
                            Update Status
                          </Button>
                          <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <h1 className="text-6xl font-bold mb-4">{currentPlayer.name}</h1>

                {/* Player Introduction */}
                {currentPlayer.intro && (
                  <p className="text-lg text-muted-foreground italic mb-4 max-w-2xl mx-auto">
                    "{currentPlayer.intro}"
                  </p>
                )}

              <div className="flex gap-6 justify-center text-muted-foreground">
                {currentPlayer.role && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Role:</span>
                    <span className="font-semibold">{currentPlayer.role}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm">Base Price:</span>
                  <span className="font-semibold">{currentPlayer.basePrice.toLocaleString()} pts</span>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Current Bid */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-4 mb-2">
                <Label className="text-lg text-muted-foreground">Current Bid</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetToBasePrice}
                  disabled={currentPrice === currentPlayer.basePrice}
                  className="text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset to Base
                </Button>
              </div>
              <div className="text-7xl font-bold text-green-600 mb-6">
                {currentPrice.toLocaleString()} pts
              </div>

              {/* Quick Increment Buttons */}
              <div className="flex gap-3 justify-center mb-4">
                {[10000, 25000, 50000, 100000].map(amount => (
                  <Button
                    key={amount}
                    onClick={() => incrementPrice(amount)}
                    size="lg"
                    variant="outline"
                  >
                    +{amount.toLocaleString()}
                  </Button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="flex gap-3 justify-center max-w-md mx-auto">
                <Input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomIncrement()}
                  className="text-lg"
                />
                <Button onClick={handleCustomIncrement} disabled={!customAmount || Number(customAmount) <= 0}>
                  Add
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Team Selection */}
            <div className="mb-6">
              <Label className="text-lg text-center block mb-4">Select Team</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {teams.map(team => {
                  const canAfford = team.remainingBudget >= currentPrice;
                  return (
                    <button
                      key={team.id}
                      onClick={() => canAfford && setSelectedTeam(team.id)}
                      disabled={!canAfford}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedTeam === team.id
                          ? 'scale-105 shadow-lg'
                          : canAfford ? 'hover:shadow-md' : 'opacity-50 cursor-not-allowed'
                      }`}
                      style={{
                        borderColor: selectedTeam === team.id ? team.color : '#e5e7eb',
                        backgroundColor: selectedTeam === team.id ? `${team.color}15` : 'white',
                      }}
                    >
                      <div className="w-10 h-10 rounded-full mx-auto mb-2" style={{ backgroundColor: team.color }} />
                      <p className="font-semibold text-sm truncate">{team.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {team.remainingBudget.toLocaleString()} pts
                      </p>
                      {!canAfford && (
                        <p className="text-xs text-destructive mt-1">Insufficient</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pt-4">
              <Button
                onClick={handleSold}
                disabled={!selectedTeam}
                size="lg"
                className="px-8 py-6 text-xl bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-6 h-6 mr-2" />
                SOLD
              </Button>
              <Button
                onClick={handleUnsold}
                size="lg"
                variant="destructive"
                className="px-8 py-6 text-xl"
              >
                <XCircle className="w-6 h-6 mr-2" />
                UNSOLD
              </Button>
              <Button
                onClick={handlePass}
                size="lg"
                variant="secondary"
                className="px-8 py-6 text-xl"
              >
                <SkipForward className="w-6 h-6 mr-2" />
                PASS
              </Button>
            </div>
          </CardContent>
        </Card>
        ) : null}

        {/* Teams Overview Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Teams Overview</CardTitle>
                <CardDescription>Click on any team to view their complete roster</CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {teams.length} Teams
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {teams.map(team => {
                const totalSpent = team.budget - team.remainingBudget;
                const avgPrice = team.players.length > 0 ? totalSpent / team.players.length : 0;
                const budgetUsed = (totalSpent / team.budget) * 100;

                return (
                  <Card
                    key={team.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      expandedTeam === team.id ? 'ring-2 ring-primary shadow-xl' : ''
                    }`}
                    onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                    style={{ borderTopColor: team.color, borderTopWidth: '4px' }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base truncate">{team.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {team.players.length} {team.players.length === 1 ? 'player' : 'players'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-semibold">{team.budget.toLocaleString()} pts</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Spent</span>
                        <span className="font-semibold text-red-600">{totalSpent.toLocaleString()} pts</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-semibold text-green-600">{team.remainingBudget.toLocaleString()} pts</span>
                      </div>
                      {team.players.length > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Avg Price</span>
                          <span className="font-semibold">{Math.round(avgPrice).toLocaleString()} pts</span>
                        </div>
                      )}
                      <div className="pt-2">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${budgetUsed}%`,
                              backgroundColor: team.color,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-center">{budgetUsed.toFixed(1)}% used</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Team Roster Details */}
        {expandedTeam && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: teams.find(t => t.id === expandedTeam)?.color }}
                />
                <div>
                  <CardTitle className="text-xl">
                    {teams.find(t => t.id === expandedTeam)?.name} Squad
                  </CardTitle>
                  <CardDescription>Complete roster and spending details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {teams.find(t => t.id === expandedTeam)?.players.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No players in this team yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teams
                    .find(t => t.id === expandedTeam)
                    ?.players.map((player, idx) => (
                      <div
                        key={player.id}
                        className="bg-muted rounded-lg p-3 border-l-4"
                        style={{
                          borderLeftColor: teams.find(t => t.id === expandedTeam)?.color,
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                              <p className="font-semibold text-sm">{player.name}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {player.role || 'Player'}
                              {player.category && ` • ${player.category}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t">
                          <span className="text-xs text-muted-foreground">
                            Base: {player.basePrice.toLocaleString()} pts
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {(player.currentPrice || 0).toLocaleString()} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  <div className="bg-primary/10 rounded-lg p-3 border-l-4 border-primary flex items-center justify-between">
                    <span className="font-semibold">Total Spent:</span>
                    <span className="text-lg font-bold text-red-600">
                      {(
                        (teams.find(t => t.id === expandedTeam)?.budget || 0) -
                        (teams.find(t => t.id === expandedTeam)?.remainingBudget || 0)
                      ).toLocaleString()} pts
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Actions */}
        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Actions</CardTitle>
              <CardDescription>Last 5 auction activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.slice(0, 5).map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{entry.playerName}</span>
                        <Badge variant={
                          entry.action === 'sold' ? 'default' :
                          entry.action === 'unsold' ? 'destructive' :
                          'secondary'
                        } className="text-xs">
                          {entry.action}
                        </Badge>
                      </div>
                      {entry.price && (
                        <span className="font-semibold">{entry.price.toLocaleString()} pts</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        
      </main>
    </div>
  );
}
