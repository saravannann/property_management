'use client';
import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Divider,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Avatar,
  Chip,
  IconButton,
  Stack,
  alpha,
  useTheme,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem
} from '@mui/material';
import { 
  UserPlus, 
  Shield, 
  MoreHorizontal, 
  Mail, 
  ShieldCheck,
  ShieldAlert,
  UserCog,
  Phone,
  Trash2
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { createNewUser, deleteUser } from './actions';
import { useLanguage } from '@/components/LanguageProvider';

export default function UserManagementPage() {
  const theme = useTheme();
  const { setLocale } = useLanguage();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    phone: '',
    role: 'manager'
  });

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      // Fallback for demo
      setProfiles([
        { id: '1', email: 'admin@example.com', full_name: 'Saravanan Elumalai', role: 'admin', created_at: new Date().toISOString() },
        { id: '2', email: 'manager@example.com', full_name: 'Priya Singh', role: 'manager', created_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      setCurrentUser(profile);
    };
    checkAdmin();
    fetchProfiles();
  }, []);

  const handleRoleChange = async (profile: any, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profile.id);

      if (error) throw error;
      fetchProfiles();
    } catch (error: any) {
      alert('Error updating role: ' + error.message);
    }
  };

  const handleAddUser = async () => {
    if (!newUserForm.fullName || !newUserForm.phone) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setAddingUser(true);
      const result = await createNewUser(newUserForm);
      if (result.success) {
        setIsDialogOpen(false);
        setNewUserForm({ fullName: '', phone: '', role: 'manager' });
        fetchProfiles();
      } else {
        alert('Error adding user: ' + result.error);
      }
    } catch (error: any) {
      alert('Unexpected error: ' + error.message);
    } finally {
      setAddingUser(false);
    }
  };

  if (currentUser && currentUser.role !== 'admin') {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">Access Denied</Typography>
        <Typography>Only administrators can manage users.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 2, sm: 0 }, mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage team members, permissions, and roles.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<UserPlus size={18} />}
          onClick={() => setIsDialogOpen(true)}
          sx={{ py: 1 }}
        >
          Add Team Member
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Desktop Table View */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <TableContainer component={Card}>
              <Table>
                <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha('#000', 0.02) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Member</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Email / Phone</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Language</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Joined Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id} sx={{ '&:hover': { bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.01) : alpha('#000', 0.01) } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: profile.role === 'admin' ? alpha(theme.palette.secondary.main, 0.1) : alpha(theme.palette.primary.main, 0.1), 
                            color: profile.role === 'admin' ? theme.palette.secondary.main : theme.palette.primary.main,
                            fontWeight: 700 
                          }}>
                            {profile.full_name ? profile.full_name[0] : (profile.email ? profile.email[0].toUpperCase() : '?')}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{profile.full_name || 'New User'}</Typography>
                            <Typography variant="caption" color="text.secondary">ID: {profile.id.substring(0, 8)}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
                            <Mail size={14} style={{ opacity: 0.7 }} />
                            <Typography variant="body2">{profile.email}</Typography>
                          </Box>
                          {profile.phone_number && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                              <Phone size={14} style={{ opacity: 0.7 }} />
                              <Typography variant="caption">{profile.phone_number}</Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={profile.role === 'admin' ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                          label={profile.role.toUpperCase()} 
                          size="small"
                          color={profile.role === 'admin' ? 'secondary' : 'primary'}
                          variant="outlined"
                          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={profile.language || 'en'}
                          onChange={async (e) => {
                            try {
                              const newLang = e.target.value;
                              if (currentUser && profile.id === currentUser.id) {
                                // If the admin is changing their own language, use the setLocale provider 
                                // to sync DB, localStorage, cookies, and trigger an instant session reload
                                await setLocale(newLang as 'en' | 'ta');
                              } else {
                                // If changing another user's language, simply write to the DB
                                const { error } = await supabase
                                  .from('profiles')
                                  .update({ language: newLang })
                                  .eq('id', profile.id);
                                if (error) throw error;
                                fetchProfiles();
                              }
                            } catch (err: any) {
                              alert('Error updating language: ' + err.message);
                            }
                          }}
                          sx={{ 
                            width: 105, 
                            '& .MuiOutlinedInput-root': { fontSize: '0.75rem', height: 32 }
                          }}
                        >
                          <MenuItem value="en">English</MenuItem>
                          <MenuItem value="ta">தமிழ்</MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          onClick={() => handleRoleChange(profile, profile.role === 'admin' ? 'manager' : 'admin')}
                          title="Toggle Role"
                          sx={{ color: 'primary.main' }}
                        >
                          <UserCog size={18} />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={async () => {
                            if (confirm('Are you sure you want to permanently delete this user? This will completely remove both their authentication account and user profile.')) {
                              try {
                                const res = await deleteUser(profile.id);
                                if (res.success) {
                                  fetchProfiles();
                                } else {
                                  alert('Error deleting user: ' + res.error);
                                }
                              } catch (err: any) {
                                alert('Failed to delete user: ' + err.message);
                              }
                            }
                          }}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Mobile Card list View */}
          <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
            <Stack spacing={2}>
              {profiles.map((profile) => (
                <Card key={profile.id} sx={{ position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    bottom: 0, 
                    width: 4, 
                    bgcolor: profile.role === 'admin' ? 'secondary.main' : 'primary.main'
                  }} />
                  <CardContent sx={{ p: 2, pl: 3, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ 
                          bgcolor: profile.role === 'admin' ? alpha(theme.palette.secondary.main, 0.1) : alpha(theme.palette.primary.main, 0.1), 
                          color: profile.role === 'admin' ? theme.palette.secondary.main : theme.palette.primary.main,
                          fontWeight: 700,
                          width: 36,
                          height: 36,
                          fontSize: '0.9rem'
                        }}>
                          {profile.full_name ? profile.full_name[0] : (profile.email ? profile.email[0].toUpperCase() : '?')}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{profile.full_name || 'New User'}</Typography>
                          <Typography variant="caption" color="text.secondary">ID: {profile.id.substring(0, 8)}</Typography>
                        </Box>
                      </Box>
                      <Chip 
                        icon={profile.role === 'admin' ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                        label={profile.role.toUpperCase()} 
                        size="small"
                        color={profile.role === 'admin' ? 'secondary' : 'primary'}
                        variant="outlined"
                        sx={{ fontWeight: 800, fontSize: '0.6rem', height: 20 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
                        <Mail size={14} style={{ opacity: 0.7 }} />
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{profile.email}</Typography>
                      </Box>
                      {profile.phone_number && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                          <Phone size={14} style={{ opacity: 0.7 }} />
                          <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>{profile.phone_number}</Typography>
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ my: 1.5, opacity: 0.1 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Language:</Typography>
                        <TextField
                          select
                          size="small"
                          value={profile.language || 'en'}
                          onChange={async (e) => {
                            try {
                              const newLang = e.target.value;
                              if (currentUser && profile.id === currentUser.id) {
                                await setLocale(newLang as 'en' | 'ta');
                              } else {
                                const { error } = await supabase
                                  .from('profiles')
                                  .update({ language: newLang })
                                  .eq('id', profile.id);
                                if (error) throw error;
                                fetchProfiles();
                              }
                            } catch (err: any) {
                              alert('Error updating language: ' + err.message);
                            }
                          }}
                          sx={{ 
                            width: 90, 
                            '& .MuiOutlinedInput-root': { fontSize: '0.7rem', height: 26 }
                          }}
                        >
                          <MenuItem value="en">English</MenuItem>
                          <MenuItem value="ta">தமிழ்</MenuItem>
                        </TextField>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleRoleChange(profile, profile.role === 'admin' ? 'manager' : 'admin')}
                          title="Toggle Role"
                          sx={{ bgcolor: alpha(theme.palette.text.primary, 0.05), color: 'primary.main' }}
                        >
                          <UserCog size={16} />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={async () => {
                            if (confirm('Are you sure you want to permanently delete this user? This will completely remove both their authentication account and user profile.')) {
                              try {
                                const res = await deleteUser(profile.id);
                                if (res.success) {
                                  fetchProfiles();
                                } else {
                                  alert('Error deleting user: ' + res.error);
                                }
                              } catch (err: any) {
                                alert('Failed to delete user: ' + err.message);
                              }
                            }
                          }}
                          sx={{ bgcolor: alpha(theme.palette.text.primary, 0.05) }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        </>
      )}

      {/* Add User Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add New Team Member</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new account for a property manager or administrator.
          </Typography>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField 
              fullWidth 
              label="Full Name" 
              placeholder="e.g. Rahul Sharma" 
              value={newUserForm.fullName}
              onChange={(e) => setNewUserForm({...newUserForm, fullName: e.target.value})}
            />
            <TextField 
              fullWidth 
              label="Mobile Number" 
              placeholder="+919962293848" 
              value={newUserForm.phone}
              onChange={(e) => setNewUserForm({...newUserForm, phone: e.target.value})}
            />
            <TextField 
              fullWidth 
              select 
              label="Role" 
              value={newUserForm.role}
              onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
            >
              <MenuItem value="admin">Admin (Super User)</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsDialogOpen(false)} disabled={addingUser}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddUser} 
            disabled={addingUser}
            startIcon={addingUser ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {addingUser ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
