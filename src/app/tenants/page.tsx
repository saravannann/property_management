'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
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
  Trash2,
  FileText,
  ExternalLink
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
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState(propertyId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  
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

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('id, name')
          .order('name');
        if (error) throw error;
        setProperties(data || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };
    fetchProperties();
  }, []);

  useEffect(() => {
    if (propertyId) {
      setSelectedProperty(propertyId);
    }
  }, [propertyId]);

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

      // Filter by property
      if (selectedProperty && selectedProperty !== 'all') {
        query = query.eq('property_id', selectedProperty);
      }

      const { data, error } = await query.order('unit_number', { ascending: true });

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
  }, [statusFilter, selectedProperty]);

  const getStatusColor = (status: string) => {
    if (status === 'Active') return { color: '#10b981', label: 'Active' };
    if (status === 'Late Payment') return { color: '#f59e0b', label: 'Late Payment' };
    return { color: '#64748b', label: 'Inactive' };
  };

  const filteredTenants = tenants.filter(t => {
    const q = searchQuery.toLowerCase();
    return (
      (t.name || '').toLowerCase().includes(q) ||
      (t.unit_number || '').toLowerCase().includes(q) ||
      (t.phone_number || '').toLowerCase().includes(q) ||
      (t.email || '').toLowerCase().includes(q) ||
      (t.properties?.name || '').toLowerCase().includes(q)
    );
  });

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 2, sm: 0 }, mb: { xs: 2, md: 4 } }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Tenants
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Manage residents and lease agreements.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
          <TextField
            select
            size="small"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            sx={{ flex: { xs: 1.2, sm: 'none' }, minWidth: { xs: 0, sm: 160 }, '& .MuiSelect-select': { py: 0.75, fontSize: '0.75rem' } }}
          >
            <MenuItem value="all">All Properties</MenuItem>
            {properties.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ flex: { xs: 1, sm: 'none' }, minWidth: { xs: 0, sm: 120 }, '& .MuiSelect-select': { py: 0.75, fontSize: '0.75rem' } }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <Button 
            variant="contained" 
            size="small"
            startIcon={<Plus size={16} />}
            component={Link}
            href="/tenants/add"
            sx={{ whiteSpace: 'nowrap', py: 0.9 }}
          >
            Add
          </Button>
        </Stack>
      </Box>

      {/* Search Bar */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        bgcolor: 'background.paper', 
        px: 2, 
        py: 1, 
        borderRadius: 2,
        border: '1px solid rgba(255, 255, 255, 0.05)',
        mb: { xs: 2, md: 4 }
      }}>
        <Search size={18} style={{ color: alpha('#f8fafc', 0.5) }} />
        <InputBase
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ ml: 1, flex: 1, color: 'text.primary', fontSize: '0.85rem' }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Mobile View: Compact Cards */}
          <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' }, mb: 4 }}>
            {filteredTenants.map((tenant) => {
              const statusInfo = getStatusColor(tenant.is_active ? 'Active' : 'Inactive');
              return (
                <Card key={tenant.id} sx={{ bgcolor: alpha('#fff', 0.01) }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: alpha('#6366f1', 0.1), color: 'primary.main', fontWeight: 700 }}>
                          {tenant.name.split(' ').map((n: string) => n[0]).join('')}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{tenant.name}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <Home size={10} />
                            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{tenant.unit_number}</Typography>
                            <Typography variant="caption" sx={{ mx: 0.5 }}>•</Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>₹{tenant.monthly_rent.toLocaleString()}</Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        <Stack direction="row" spacing={0.5}>
                          {tenant.agreement_url && (
                            <IconButton 
                              size="small" 
                              sx={{ p: 0.5, color: 'primary.main' }}
                              onClick={() => {
                                const { data } = supabase.storage.from('tenant-agreements').getPublicUrl(tenant.agreement_url);
                                window.open(data.publicUrl, '_blank');
                              }}
                            >
                              <FileText size={14} />
                            </IconButton>
                          )}
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, tenant.id)}>
                            <MoreHorizontal size={14} />
                          </IconButton>
                        </Stack>
                        <Chip 
                          label={statusInfo.label} 
                          size="small"
                          sx={{ 
                            height: 16, 
                            fontSize: '0.55rem', 
                            fontWeight: 800, 
                            bgcolor: alpha(statusInfo.color, 0.1), 
                            color: statusInfo.color,
                            border: 'none'
                          }} 
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>

          {/* Desktop View: Table */}
          <TableContainer component={Card} sx={{ display: { xs: 'none', md: 'block' } }}>
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
                {filteredTenants.map((tenant) => {
                  const statusInfo = getStatusColor(tenant.is_active ? 'Active' : 'Inactive');
                  return (
                    <TableRow key={tenant.id} sx={{ '&:hover': { bgcolor: alpha('#fff', 0.01) } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: alpha('#6366f1', 0.1), color: 'primary.main', fontWeight: 700, width: 32, height: 32, fontSize: '0.85rem' }}>
                            {tenant.name.split(' ').map((n: string) => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{tenant.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Move-in: {new Date(tenant.move_in_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <Phone size={12} color="#818cf8" />
                            <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>{tenant.phone_number}</Typography>
                          </Box>
                          {tenant.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                              <Mail size={12} color="#818cf8" />
                              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>{tenant.email}</Typography>
                            </Box>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Home size={14} style={{ color: '#c084fc' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                            {tenant.properties?.name || 'Unknown'}
                          </Typography>
                          <Chip label={tenant.unit_number} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                          ₹{tenant.monthly_rent.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={statusInfo.label} 
                          size="small"
                          sx={{ 
                            height: 18,
                            fontWeight: 800, 
                            fontSize: '0.6rem',
                            bgcolor: alpha(statusInfo.color, 0.1),
                            color: statusInfo.color,
                            border: 'none'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack spacing={1} sx={{ direction: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {tenant.agreement_url && (
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => {
                                const { data } = supabase.storage.from('tenant-agreements').getPublicUrl(tenant.agreement_url);
                                window.open(data.publicUrl, '_blank');
                              }}
                              title="View Agreement"
                            >
                              <FileText size={16} />
                            </IconButton>
                          )}
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, tenant.id)}>
                            <MoreHorizontal size={16} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
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
