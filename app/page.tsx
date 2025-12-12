'use client';

import Link from 'next/link';
import { useStorageStats, useClearStorage } from '@/hooks/use-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Trophy, Play, BarChart3, RotateCcw, Loader2 } from 'lucide-react';

export default function Home() {
  const { stats, loading, reload } = useStorageStats();
  const { clearAll } = useClearStorage();

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all data? This will delete teams, players, and auction progress.')) {
      await clearAll();
      await reload();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Trophy className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Sports Auction System</h1>
                <p className="text-sm text-muted-foreground">Professional Team Auction Management</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset All Data
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.teams}</div>
                  <p className="text-xs text-muted-foreground">Teams configured</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.players}</div>
                  <p className="text-xs text-muted-foreground">Players added</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auction Status</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {stats.hasAuction ? 'Active' : 'Not Started'}
                  </div>
                  <p className="text-xs text-muted-foreground">Current state</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* Main Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Manage Teams
                </CardTitle>
                <CardDescription>
                  Create and configure teams with budgets and colors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/teams">
                  <Button className="w-full">
                    {stats.teams > 0 ? 'View Teams' : 'Create Teams'}
                  </Button>
                </Link>
                {stats.teams > 0 && (
                  <p className="text-sm text-muted-foreground mt-3 text-center">
                    {stats.teams} {stats.teams === 1 ? 'team' : 'teams'} configured
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Manage Players
                </CardTitle>
                <CardDescription>
                  Add players with base prices and categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/players">
                  <Button className="w-full" variant="outline">
                    {stats.players > 0 ? 'View Players' : 'Add Players'}
                  </Button>
                </Link>
                {stats.players > 0 && (
                  <p className="text-sm text-muted-foreground mt-3 text-center">
                    {stats.players} {stats.players === 1 ? 'player' : 'players'} added
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Auction Section */}
        <Card className="mb-8 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Play className="w-6 h-6" />
                  Live Auction
                </CardTitle>
                <CardDescription className="mt-2">
                  Start the auction interface optimized for projectors and large displays
                </CardDescription>
              </div>
              {stats.hasAuction && (
                <Badge variant="default">In Progress</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/auction">
              <Button size="lg" className="w-full md:w-auto min-w-[200px]">
                {stats.hasAuction ? 'Resume Auction' : 'Start Auction'}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Auction Results
            </CardTitle>
            <CardDescription>
              View final team rosters, spending analysis, and export data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/results">
              <Button variant="outline" className="w-full md:w-auto">
                View Results
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Instructions */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold mb-4">Getting Started</h3>
          <div className="grid gap-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Set up teams</p>
                <p className="text-sm text-muted-foreground">Create teams with their budgets and select team colors</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Add players</p>
                <p className="text-sm text-muted-foreground">Add players individually or import them in bulk using CSV format</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Run the auction</p>
                <p className="text-sm text-muted-foreground">Launch the auction interface on a projector or big screen</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <p className="font-medium">View results</p>
                <p className="text-sm text-muted-foreground">Check final team rosters and export auction data</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Sports Auction System - All data is stored locally in your browser using IndexedDB
          </p>
        </div>
      </footer>
    </div>
  );
}
