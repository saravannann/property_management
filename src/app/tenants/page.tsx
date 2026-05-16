'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Avatar,
  Chip,
  IconButton,
  InputBase,
  Stack,
  alpha,
  useTheme,
  CircularProgress,
  TextField,
  InputAdornment,
  MenuItem,
  Menu
} from '@mui/material';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Phone, 
  Mail, 
  Home, 
  ShieldCheck, 
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from '@/lib/supabase';

function TenantsContent() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedTenantId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTenantId(null);
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenantId) return;
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', selectedTenantId);

      if (error) throw error;
      fetchTenants();
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert('Failed to delete tenant');
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('tenants')
        .select(`
          *,
          properties (
            name
          )
        `);

      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }

      // Filter by property if coming from property card
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [statusFilter, propertyId]);

  const getStatusColor = (status: string) => {
    if (status === 'Active') return { color: '#10b981', label: 'Active' };
    if (status === 'Late Payment') return { color: '#f59e0b', label: 'Late Payment' };
    return { color: '#64748b', label: 'Inactive' };
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Tenants
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of current residents and lease agreements.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 120 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Filter size={16} />
                  </InputAdornment>
                ),
              }
            }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <Button 
            variant="contained" 
            startIcon={<Plus size={18} />}
            component={Link}
            href="/tenants/add"
          >
            Add Tenant
          </Button>
        </Stack>
      </Box>

      {/* Search Bar */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        bgcolor: 'background.paper', 
        px: 3, 
        py: 1.5, 
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.05)',
        mb: 4
      }}>
        <Search size={20} style={{ color: alpha('#f8fafc', 0.5) }} />
        <InputBase
          placeholder="Search by name, contact or unit number..."
          sx={{ ml: 2, flex: 1, color: 'text.primary', fontSize: '0.95rem' }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Card}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: alpha('#fff', 0.02) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Tenant</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Contact Info</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Property / Unit</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Monthly Rent</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((tenant) => {
                const statusInfo = getStatusColor(tenant.is_active ? 'Active' : 'Inactive');
                return (
                  <TableRow key={tenant.id} sx={{ '&:hover': { bgcolor: alpha('#fff', 0.01) } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: alpha('#6366f1', 0.1), color: 'primary.main', fontWeight: 700 }}>
                          {tenant.name.split(' ').map((n: string) => n[0]).join('')}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{tenant.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Move-in: {new Date(tenant.move_in_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                          <Phone size={14} color="#818cf8" />
                          <Typography variant="caption">{tenant.phone_number}</Typography>
                        </Box>
                        {tenant.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                            <Mail size={14} color="#818cf8" />
                            <Typography variant="caption">{tenant.email}</Typography>
                          </Box>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Home size={16} style={{ color: '#c084fc' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {tenant.properties?.name || 'Unknown Property'}
                        </Typography>
                        <Chip label={tenant.unit_number} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        ₹{tenant.monthly_rent.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={statusInfo.label} 
                        size="small"
                        variant="outlined"
                        sx={{ 
                          fontWeight: 800, 
                          fontSize: '0.65rem',
                          bgcolor: alpha(statusInfo.color, 0.1),
                          color: statusInfo.color,
                          border: 'none'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, tenant.id)}>
                        <MoreHorizontal size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {tenants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 10 }}>
                    <Typography color="text.secondary">No tenants found. Click "Add Tenant" to get started.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#1e1e1e',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              minWidth: 160,
              backgroundImage: 'none'
            }
          }
        }}
      >
        <MenuItem 
          onClick={() => {
            router.push(`/tenants/${selectedTenantId}/edit`);
            handleMenuClose();
          }}
          sx={{ gap: 1.5, color: '#f8fafc', py: 1.5 }}
        >
          <Edit size={16} />
          Edit Tenant
        </MenuItem>
        <MenuItem 
          onClick={handleDeleteTenant}
          sx={{ gap: 1.5, color: '#ef4444', py: 1.5 }}
        >
          <Trash2 size={16} />
          Delete Tenant
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default function TenantsPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    }>
      <TenantsContent />
    </Suspense>
  );
}
