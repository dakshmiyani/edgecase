import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { 
  Users, UserPlus, Shield, Store, Trash2, 
  Search, Loader2, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  // Create User Form State
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', phone: '', role: 'merchant' });
  const [createLoading, setCreateLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/users/create', newUser);
      setSuccess('User created successfully');
      setNewUser({ email: '', phone: '', role: 'merchant' });
      setShowAdd(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.user_token_id.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const roleIcons = {
    admin: <Shield className="w-4 h-4 text-violet-400" />,
    merchant: <Store className="w-4 h-4 text-cyan-400" />,
    developer: <Store className="w-4 h-4 text-blue-400" />,
    user: <Users className="w-4 h-4 text-emerald-400" />
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" />
            User Management
          </h3>
          <p className="text-sm text-white/40">Manage admins, merchants, and customers</p>
        </div>
        <Button 
          variant="glow" 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-violet-600 hover:bg-violet-500"
        >
          <UserPlus className="w-4 h-4 mr-2" /> Add System User
        </Button>
      </div>

      {showAdd && (
        <Card className="border-violet-500/20 bg-violet-500/5">
          <CardHeader>
            <CardTitle className="text-sm">Create New Privileged User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase">Email</label>
                <Input 
                  placeholder="email@example.com" 
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase">Phone</label>
                <Input 
                  placeholder="+1234567890" 
                  value={newUser.phone}
                  onChange={e => setNewUser({...newUser, phone: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase">Role</label>
                <select 
                  className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="merchant">Merchant</option>
                  <option value="developer">Developer</option>
                  <option value="admin">Administrator</option>
                  <option value="user">User (Customer)</option>
                </select>
              </div>
              <Button type="submit" disabled={createLoading} className="w-full">
                {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4" /> {success}
        </div>
      )}

      <Card>
        <CardHeader className="pb-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <Input 
              placeholder="Search by token or role..." 
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User / Token</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-white/20">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading system users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-white/20">
                    No users found matching "{search}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.user_token_id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{user.name || 'Anonymous'}</span>
                        <span className="text-[10px] font-mono text-white/30">{user.user_token_id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-white/60">{user.email || '—'}</span>
                        <span className="text-[10px] text-white/30">{user.phone || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {roleIcons[user.role]}
                        <span className="capitalize text-sm font-medium">{user.role}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-white/40">
                      {new Date(user.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
