'use client';

import { useState, useEffect } from 'react';
import { Team } from '@/types/auction';
import { storage, migrateFromLocalStorage } from '@/lib/storage';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Home, Printer, Download, Trophy, Loader2 } from 'lucide-react';

export default function ResultsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await migrateFromLocalStorage();

      const savedState = await storage.getAuctionState();
      if (savedState) {
        setTeams(savedState.teams);
      } else {
        const savedTeams = await storage.getTeams();
        setTeams(savedTeams);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const selectedTeamData = teams.find(t => t.id === selectedTeam);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const exportData = teams.map(team => ({
      team: team.name,
      totalBudget: team.budget,
      spent: team.budget - team.remainingBudget,
      remaining: team.remainingBudget,
      players: team.players.map(p => ({
        name: p.name,
        price: p.currentPrice,
        role: p.role,
        category: p.category,
      })),
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auction-results-${Date.now()}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b print:hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Auction Results</h1>
              <p className="text-sm text-muted-foreground">Final team rosters and spending analysis</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Link href="/">
                <Button variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Teams Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {teams.map(team => {
            const totalSpent = team.budget - team.remainingBudget;
            const avgPrice = team.players.length > 0 ? totalSpent / team.players.length : 0;
            const budgetUsed = (totalSpent / team.budget) * 100;

            return (
              <Card
                key={team.id}
                className={`cursor-pointer transition-all hover:shadow-xl ${
                  selectedTeam === team.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedTeam(selectedTeam === team.id ? '' : team.id)}
                style={{ borderTopColor: team.color, borderTopWidth: '4px' }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    {team.logoFile || team.logoUrl ? (
                      <img
                        src={team.logoFile || team.logoUrl}
                        alt={`${team.name} logo`}
                        className="w-10 h-10 rounded-full object-contain bg-white border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full" style={{ backgroundColor: team.color }} />
                    )}
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Budget</span>
                    <span className="font-semibold">{team.budget.toLocaleString()} pts</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-semibold text-red-600">{totalSpent.toLocaleString()} pts</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-semibold text-green-600">{team.remainingBudget.toLocaleString()} pts</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Players</span>
                    <Badge variant="secondary">{team.players.length}</Badge>
                  </div>
                  {team.players.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Price</span>
                      <span className="font-semibold">{avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} pts</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${budgetUsed}%`,
                          backgroundColor: team.color,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{budgetUsed.toFixed(1)}% used</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Selected Team Details */}
        {selectedTeamData && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-4">
                {selectedTeamData.logoFile || selectedTeamData.logoUrl ? (
                  <img
                    src={selectedTeamData.logoFile || selectedTeamData.logoUrl}
                    alt={`${selectedTeamData.name} logo`}
                    className="w-14 h-14 rounded-xl object-contain bg-white border"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl" style={{ backgroundColor: selectedTeamData.color }} />
                )}
                <div>
                  <CardTitle className="text-2xl">{selectedTeamData.name} Squad</CardTitle>
                  <CardDescription>Complete team roster and player details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedTeamData.players.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No players in this team</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Player Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Base Price</TableHead>
                      <TableHead className="text-right">Sold Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTeamData.players.map((player, idx) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-semibold">{player.name}</TableCell>
                        <TableCell>{player.role || '-'}</TableCell>
                        <TableCell>
                          {player.category ? <Badge variant="outline">{player.category}</Badge> : '-'}
                        </TableCell>
                        <TableCell className="text-right">{player.basePrice.toLocaleString()} pts</TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-green-600">
                            {player.currentPrice?.toLocaleString()} pts
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted font-semibold">
                      <TableCell colSpan={5} className="text-right">Total Spent:</TableCell>
                      <TableCell className="text-right text-red-600">
                        {(selectedTeamData.budget - selectedTeamData.remainingBudget).toLocaleString()} pts
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Teams Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6" />
              <div>
                <CardTitle>Complete Overview</CardTitle>
                <CardDescription>All teams and their rosters</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {teams.map(team => (
                <div key={team.id}>
                  <div className="flex items-center gap-3 mb-4">
                    {team.logoFile || team.logoUrl ? (
                      <img
                        src={team.logoFile || team.logoUrl}
                        alt={`${team.name} logo`}
                        className="w-10 h-10 rounded-full object-contain bg-white border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full" style={{ backgroundColor: team.color }} />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{team.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {team.players.length} players • {(team.budget - team.remainingBudget).toLocaleString()} pts spent
                      </p>
                    </div>
                  </div>
                  {team.players.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {team.players.map(player => (
                        <div
                          key={player.id}
                          className="bg-muted rounded-lg p-4 border-l-4"
                          style={{ borderLeftColor: team.color }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-semibold">{player.name}</p>
                              <p className="text-sm text-muted-foreground">{player.role || 'Player'}</p>
                            </div>
                            {player.category && (
                              <Badge variant="secondary" className="text-xs">{player.category}</Badge>
                            )}
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-muted-foreground">
                              Base: {player.basePrice.toLocaleString()} pts
                            </span>
                            <span className="text-sm font-bold text-green-600">
                              {player.currentPrice?.toLocaleString()} pts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No players in this team</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
