'use client';

import { useState, useEffect } from 'react';
import { Player } from '@/types/auction';
import { storage } from '@/lib/storage';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Home, Plus, Upload, Pencil, Trash2, Users } from 'lucide-react';

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showCsvDialog, setShowCsvDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [csvData, setCsvData] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    basePrice: '',
    category: '',
    role: '',
    intro: '',
    photoUrl: '',
    photoFile: '',
  });

  useEffect(() => {
    const savedPlayers = storage.getPlayers();
    setPlayers(savedPlayers);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPlayer) {
      const updated = players.map(p =>
        p.id === editingPlayer.id
          ? {
              ...p,
              ...formData,
              basePrice: Number(formData.basePrice),
              intro: formData.intro || undefined,
              photoUrl: formData.photoUrl || undefined,
              photoFile: formData.photoFile || undefined,
            }
          : p
      );
      setPlayers(updated);
      storage.savePlayers(updated);
    } else {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: formData.name,
        basePrice: Number(formData.basePrice),
        category: formData.category,
        role: formData.role,
        status: 'available',
        intro: formData.intro || undefined,
        photoUrl: formData.photoUrl || undefined,
        photoFile: formData.photoFile || undefined,
      };
      const updated = [...players, newPlayer];
      setPlayers(updated);
      storage.savePlayers(updated);
    }

    resetForm();
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      basePrice: player.basePrice.toString(),
      category: player.category || '',
      role: player.role || '',
      intro: player.intro || '',
      photoUrl: player.photoUrl || '',
      photoFile: player.photoFile || '',
    });
    setShowDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      const updated = players.filter(p => p.id !== id);
      setPlayers(updated);
      storage.savePlayers(updated);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', basePrice: '', category: '', role: '', intro: '', photoUrl: '', photoFile: '' });
    setEditingPlayer(null);
    setShowDialog(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoFile: reader.result as string, photoUrl: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvData.trim()) return;

    const lines = csvData.trim().split('\n');
    const newPlayers: Player[] = lines.map((line, index) => {
      const [name, basePrice, category, role, intro, photoUrl] = line.split(',').map(s => s.trim());
      return {
        id: `${Date.now()}-${index}`,
        name: name || `Player ${index + 1}`,
        basePrice: Number(basePrice) || 10000,
        category: category || '',
        role: role || '',
        intro: intro || undefined,
        photoUrl: photoUrl || undefined,
        status: 'available' as const,
      };
    });

    const updated = [...players, ...newPlayers];
    setPlayers(updated);
    storage.savePlayers(updated);
    setCsvData('');
    setShowCsvDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Player Management</h1>
              <p className="text-sm text-muted-foreground">Add and manage players for the auction</p>
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

        <div className="flex gap-4 mb-8">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingPlayer ? 'Edit Player' : 'Add New Player'}</DialogTitle>
                <DialogDescription>
                  {editingPlayer ? 'Update player information' : 'Add a new player to the auction'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Player Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Base Price *</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      required
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      placeholder="Enter price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., A, B, C"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="e.g., Batsman"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intro">Player Introduction</Label>
                  <Textarea
                    id="intro"
                    value={formData.intro}
                    onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                    placeholder="Brief introduction about the player..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photoUrl">Photo URL</Label>
                  <Input
                    id="photoUrl"
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value, photoFile: '' })}
                    placeholder="https://example.com/photo.jpg"
                    disabled={!!formData.photoFile}
                  />
                  <p className="text-xs text-muted-foreground">Or upload a photo below</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photoFile">Upload Photo (PNG/JPEG)</Label>
                  <Input
                    id="photoFile"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileUpload}
                    disabled={!!formData.photoUrl}
                  />
                  {formData.photoFile && (
                    <div className="mt-2">
                      <img src={formData.photoFile} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, photoFile: '' })}
                        className="mt-1 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    {editingPlayer ? 'Update Player' : 'Add Player'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showCsvDialog} onOpenChange={setShowCsvDialog}>
            <DialogTrigger asChild>
              <Button size="lg" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Bulk Import Players</DialogTitle>
                <DialogDescription>
                  Paste CSV data with format: Name, Base Price, Category, Role, Intro, Photo URL (one player per line)
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBulkImport} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csvData">CSV Data</Label>
                  <Textarea
                    id="csvData"
                    required
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    placeholder="John Doe, 50000, A, Batsman, Great player with experience, https://example.com/photo.jpg&#10;Jane Smith, 75000, B, Bowler, Talented bowler, &#10;..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: Player Name, 50000, Category, Role, Intro (optional), Photo URL (optional)
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">Import Players</Button>
                  <Button type="button" variant="outline" onClick={() => { setCsvData(''); setShowCsvDialog(false); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <div className="ml-auto">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {players.length} {players.length === 1 ? 'Player' : 'Players'}
            </Badge>
          </div>
        </div>

        {players.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No players yet</h3>
              <p className="text-muted-foreground mb-6">
                Add players individually or import them in bulk using CSV
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setShowDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Player
                </Button>
                <Button variant="outline" onClick={() => setShowCsvDialog(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Players List</CardTitle>
              <CardDescription>All players available for the auction</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell>{player.basePrice.toLocaleString()} pts</TableCell>
                      <TableCell>{player.category || '-'}</TableCell>
                      <TableCell>{player.role || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          player.status === 'sold' ? 'default' :
                          player.status === 'unsold' ? 'destructive' :
                          player.status === 'passed' ? 'secondary' :
                          'outline'
                        }>
                          {player.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(player)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(player.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
