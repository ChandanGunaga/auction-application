'use client';

import { useState, useEffect } from 'react';
import { Team } from '@/types/auction';
import { storage } from '@/lib/storage';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Home, Plus, Zap, Pencil, Trash2, Users } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Green', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
];

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    budget: '',
    color: PRESET_COLORS[0].value,
  });
  const [quickSetupData, setQuickSetupData] = useState({
    numTeams: '',
    budget: '',
  });

  useEffect(() => {
    const savedTeams = storage.getTeams();
    setTeams(savedTeams);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTeam) {
      const updated = teams.map(t =>
        t.id === editingTeam.id
          ? {
              ...t,
              name: formData.name,
              color: formData.color,
              budget: Number(formData.budget),
              remainingBudget: Number(formData.budget) - (t.budget - t.remainingBudget),
            }
          : t
      );
      setTeams(updated);
      storage.saveTeams(updated);
    } else {
      const newTeam: Team = {
        id: Date.now().toString(),
        name: formData.name,
        budget: Number(formData.budget),
        remainingBudget: Number(formData.budget),
        color: formData.color,
        players: [],
      };
      const updated = [...teams, newTeam];
      setTeams(updated);
      storage.saveTeams(updated);
    }

    resetForm();
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      budget: team.budget.toString(),
      color: team.color,
    });
    setShowDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this team?')) {
      const updated = teams.filter(t => t.id !== id);
      setTeams(updated);
      storage.saveTeams(updated);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      budget: '',
      color: PRESET_COLORS[teams.length % PRESET_COLORS.length].value,
    });
    setEditingTeam(null);
    setShowDialog(false);
  };

  const handleQuickSetup = (e: React.FormEvent) => {
    e.preventDefault();

    const teamCount = Number(quickSetupData.numTeams);
    const budget = Number(quickSetupData.budget);

    const quickTeams: Team[] = Array.from({ length: teamCount }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      name: `Team ${i + 1}`,
      budget,
      remainingBudget: budget,
      color: PRESET_COLORS[i % PRESET_COLORS.length].value,
      players: [],
    }));

    setTeams(quickTeams);
    storage.saveTeams(quickTeams);
    setQuickSetupData({ numTeams: '', budget: '' });
    setShowQuickSetup(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Team Management</h1>
              <p className="text-sm text-muted-foreground">Configure teams, budgets, and colors for the auction</p>
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

      <main className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingTeam ? 'Edit Team' : 'Add New Team'}</DialogTitle>
                <DialogDescription>
                  {editingTeam ? 'Update team information' : 'Create a new team for the auction'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter team name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="Enter team budget"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Team Color</Label>
                  <div className="grid grid-cols-5 gap-3">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`h-12 rounded-lg border-4 transition-all ${
                          formData.color === color.value
                            ? 'border-primary scale-110'
                            : 'border-gray-200 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    {editingTeam ? 'Update Team' : 'Create Team'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showQuickSetup} onOpenChange={setShowQuickSetup}>
            <DialogTrigger asChild>
              <Button size="lg" variant="outline">
                <Zap className="w-4 h-4 mr-2" />
                Quick Setup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Quick Team Setup</DialogTitle>
                <DialogDescription>
                  Create multiple teams quickly with the same budget
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleQuickSetup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="numTeams">Number of Teams</Label>
                  <Input
                    id="numTeams"
                    type="number"
                    min="2"
                    max="10"
                    required
                    value={quickSetupData.numTeams}
                    onChange={(e) => setQuickSetupData({ ...quickSetupData, numTeams: e.target.value })}
                    placeholder="Enter number (2-10)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quickBudget">Budget per Team</Label>
                  <Input
                    id="quickBudget"
                    type="number"
                    min="1"
                    required
                    value={quickSetupData.budget}
                    onChange={(e) => setQuickSetupData({ ...quickSetupData, budget: e.target.value })}
                    placeholder="Enter budget"
                  />
                </div>
                <Button type="submit" className="w-full">Create Teams</Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="ml-auto">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
            </Badge>
          </div>
        </div>

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No teams yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first team or use Quick Setup
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setShowDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Team
                </Button>
                <Button variant="outline" onClick={() => setShowQuickSetup(true)}>
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Setup
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const spentBudget = team.budget - team.remainingBudget;
              const budgetPercentage = (spentBudget / team.budget) * 100;

              return (
                <Card
                  key={team.id}
                  className="group hover:shadow-xl transition-all duration-300 border-2 overflow-hidden"
                  style={{ borderTopColor: team.color, borderTopWidth: '4px' }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-12 h-12 rounded-xl shadow-lg flex-shrink-0"
                          style={{ backgroundColor: team.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-xl truncate">{team.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {team.players.length} {team.players.length === 1 ? 'player' : 'players'}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Budget</span>
                        <span className="font-semibold">{team.budget.toLocaleString()} pts</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Spent</span>
                        <span className="font-semibold text-red-600">
                          {spentBudget.toLocaleString()} pts
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-semibold text-green-600">
                          {team.remainingBudget.toLocaleString()} pts
                        </span>
                      </div>

                      {/* Budget Progress Bar */}
                      <div className="pt-2">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${budgetPercentage}%`,
                              backgroundColor: team.color,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {budgetPercentage.toFixed(1)}% budget used
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(team)}
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDelete(team.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
