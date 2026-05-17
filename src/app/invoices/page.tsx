'use client';
import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip,
  IconButton,
  InputBase,
  Stack,
  alpha,
  useTheme,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import { 
  Receipt, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Eye, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  History
} from "lucide-react";
import Link from "next/link";
import { supabase } from '@/lib/supabase';

export default function InvoicesPage() {
  const theme = useTheme();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPropertyId, setFilterPropertyId] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterTenantId, setFilterTenantId] = useState('');



  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          tenants (
            name
          ),
          properties (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);


    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      case 'elapsed': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return <CheckCircle2 size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'overdue': return <AlertCircle size={14} />;
      case 'elapsed': return <History size={14} />;
      default: return undefined;
    }
  };

  // Compute unique filter options dynamically, allowing them to cascade based on OTHER active filters
  const propertyFilteredInvoices = invoices.filter(inv => {
    if (filterTenantId && inv.tenant_id !== filterTenantId) return false;
    if (filterMonth && !inv.billing_date.startsWith(filterMonth)) return false;
    return true;
  });

  const tenantFilteredInvoices = invoices.filter(inv => {
    if (filterPropertyId && inv.property_id !== filterPropertyId) return false;
    if (filterMonth && !inv.billing_date.startsWith(filterMonth)) return false;
    return true;
  });

  const monthFilteredInvoices = invoices.filter(inv => {
    if (filterPropertyId && inv.property_id !== filterPropertyId) return false;
    if (filterTenantId && inv.tenant_id !== filterTenantId) return false;
    return true;
  });

  const uniqueProperties = Array.from(new Set(propertyFilteredInvoices.map(inv => inv.property_id))).map(id => {
    const inv = invoices.find(i => i.property_id === id);
    return { id, name: inv?.properties?.name || 'Unknown' };
  }).filter(p => p.id);

  const uniqueMonths = Array.from(new Set(monthFilteredInvoices.map(inv => inv.billing_date?.substring(0, 7))))
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(`${b}-01`).getTime() - new Date(`${a}-01`).getTime());

  const uniqueTenants = Array.from(new Set(tenantFilteredInvoices.map(inv => inv.tenant_id))).map(id => {
    const inv = invoices.find(i => i.tenant_id === id);
    return { id, name: inv?.tenants?.name || 'Unknown' };
  }).filter(t => t.id);

  // Apply filters to invoices
  const filteredInvoices = invoices.filter(inv => {
    let match = true;
    if (filterPropertyId && inv.property_id !== filterPropertyId) match = false;
    if (filterTenantId && inv.tenant_id !== filterTenantId) match = false;
    if (filterMonth && !inv.billing_date.startsWith(filterMonth)) match = false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const num = (inv.invoice_number || '').toLowerCase();
      const tenant = (inv.tenants?.name || '').toLowerCase();
      if (!num.includes(q) && !tenant.includes(q)) match = false;
    }
    return match;
  });

  // Dynamically calculate stats based on currently filtered invoices
  const stats = React.useMemo(() => {
    const collected = filteredInvoices.reduce((sum, inv) => {
      if (inv.status === 'paid') return sum + Number(inv.amount);
      return sum + Number(inv.amount_paid || 0);
    }, 0);
    
    const pending = filteredInvoices.filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + Math.max(0, Number(inv.amount) - Number(inv.amount_paid || 0)), 0);
      
    const overdue = filteredInvoices.filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + Math.max(0, Number(inv.amount) - Number(inv.amount_paid || 0)), 0);

    return {
      totalCollected: collected,
      pendingAmount: pending,
      overdueAmount: overdue
    };
  }, [filteredInvoices]);

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 2, sm: 0 }, mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Invoices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage billing, tracking, and financial history.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
          <Button variant="outlined" startIcon={<Download size={18} />} sx={{ flex: { xs: 1, sm: 'none' } }}>
            Export
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Plus size={18} />}
            component={Link}
            href="/invoices/add"
            sx={{ flex: { xs: 1, sm: 'none' } }}
          >
            Create Invoice
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: "Total Collected", value: `₹${stats.totalCollected.toLocaleString()}`, color: '#10b981' },
          { label: "Pending Amount", value: `₹${stats.pendingAmount.toLocaleString()}`, color: '#f59e0b' },
          { label: "Overdue Amount", value: `₹${stats.overdueAmount.toLocaleString()}`, color: '#ef4444' }
        ].map((stat, i) => (
          <Grid size={{ xs: 12, sm: 4 }} key={i}>
            <Card sx={{ borderLeft: `4px solid ${stat.color}`, height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 }, '&:last-child': { pb: { xs: 2.5, sm: 3 } } }}>
                <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: 1, fontSize: '0.65rem' }}>
                  {stat.label}
                </Typography>
                <Typography sx={{ fontWeight: 800, mt: 1, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
                  {loading ? <CircularProgress size={24} /> : stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 4, bgcolor: 'background.paper', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: 'none' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: alpha(theme.palette.text.primary, 0.04), borderRadius: 2, px: 2, py: 1.5 }}>
                <Search size={20} style={{ color: alpha('#f8fafc', 0.5) }} />
                <InputBase
                  placeholder="Search invoice # or tenant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ ml: 2, flex: 1, fontSize: '0.95rem' }}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Property</InputLabel>
                <Select value={filterPropertyId} label="Property" onChange={(e) => setFilterPropertyId(e.target.value)}>
                  <MenuItem value="">All Properties</MenuItem>
                  {uniqueProperties.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Tenant</InputLabel>
                <Select value={filterTenantId} label="Tenant" onChange={(e) => setFilterTenantId(e.target.value)}>
                  <MenuItem value="">All Tenants</MenuItem>
                  {uniqueTenants.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Month</InputLabel>
                <Select value={filterMonth} label="Month" onChange={(e) => setFilterMonth(e.target.value)}>
                  <MenuItem value="">All Months</MenuItem>
                  {uniqueMonths.map((m: any) => {
                    const [year, month] = m.split('-');
                    const date = new Date(Number(year), Number(month) - 1, 1);
                    return <MenuItem key={m} value={m}>{date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</MenuItem>;
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button 
                fullWidth 
                variant="text" 
                color="secondary" 
                onClick={() => { setFilterPropertyId(''); setFilterTenantId(''); setFilterMonth(''); setSearchQuery(''); }}
                disabled={!filterPropertyId && !filterTenantId && !filterMonth && !searchQuery}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
        <TableContainer component={Card}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: alpha('#fff', 0.02) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Invoice ID</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Tenant</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Balance Due</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No invoices found matching your filters.
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} sx={{ '&:hover': { bgcolor: alpha('#fff', 0.01) } }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.light' }}>
                    {invoice.invoice_number || invoice.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{invoice.tenants?.name || 'Unknown'}</Typography>
                      <Typography variant="caption" color="text.secondary">{invoice.properties?.name || 'N/A'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>₹{Number(invoice.amount).toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: Math.max(0, Number(invoice.amount) - Number(invoice.amount_paid || 0)) > 0 ? 'error.main' : 'success.main' }}>
                    ₹{Math.max(0, Number(invoice.amount) - Number(invoice.amount_paid || 0)).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={invoice.status} 
                      icon={getStatusIcon(invoice.status)}
                      size="small"
                      color={getStatusColor(invoice.status) as any}
                      variant="outlined"
                      sx={{ 
                        fontWeight: 800, 
                        fontSize: '0.65rem',
                        textTransform: 'capitalize',
                        bgcolor: alpha(
                          invoice.status.toLowerCase() === 'paid' ? '#10b981' : 
                          invoice.status.toLowerCase() === 'pending' ? '#f59e0b' : '#ef4444', 
                          0.1
                        ),
                        color: 
                          invoice.status.toLowerCase() === 'paid' ? '#10b981' : 
                          invoice.status.toLowerCase() === 'pending' ? '#f59e0b' : '#ef4444',
                        border: 'none',
                        '& .MuiChip-icon': { color: 'inherit' }
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton component={Link} href={`/invoices/${invoice.id}`} size="small" title="View Details">
                      <Eye size={18} />
                    </IconButton>
                    <IconButton size="small" title="Download"><Download size={18} /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile Card List View */}
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : filteredInvoices.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            No invoices found matching your filters.
          </Card>
        ) : (
          <Stack spacing={2.5}>
            {filteredInvoices.map((invoice) => {
              const balance = Math.max(0, Number(invoice.amount) - Number(invoice.amount_paid || 0));
              return (
                <Card key={invoice.id} sx={{ position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    bottom: 0, 
                    width: 4, 
                    bgcolor: invoice.status.toLowerCase() === 'paid' ? '#10b981' : 
                             invoice.status.toLowerCase() === 'pending' ? '#f59e0b' : '#ef4444'
                  }} />
                  <CardContent sx={{ p: 2.5, pl: 3.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'primary.light', fontSize: '0.8rem' }}>
                        {invoice.invoice_number || invoice.id.slice(0, 8).toUpperCase()}
                      </Typography>
                      <Chip 
                        label={invoice.status} 
                        icon={getStatusIcon(invoice.status)}
                        size="small"
                        color={getStatusColor(invoice.status) as any}
                        variant="outlined"
                        sx={{ 
                          fontWeight: 800, 
                          fontSize: '0.6rem',
                          textTransform: 'capitalize',
                          bgcolor: alpha(
                            invoice.status.toLowerCase() === 'paid' ? '#10b981' : 
                            invoice.status.toLowerCase() === 'pending' ? '#f59e0b' : '#ef4444', 
                            0.1
                          ),
                          color: 
                            invoice.status.toLowerCase() === 'paid' ? '#10b981' : 
                            invoice.status.toLowerCase() === 'pending' ? '#f59e0b' : '#ef4444',
                          border: 'none',
                          '& .MuiChip-icon': { color: 'inherit' }
                        }}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {invoice.tenants?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {invoice.properties?.name || 'N/A'}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1.5, opacity: 0.1 }} />

                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.6rem' }}>
                          Amount
                        </Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', mt: 0.5 }}>
                          ₹{Number(invoice.amount).toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.6rem' }}>
                          Balance Due
                        </Typography>
                        <Typography sx={{ 
                          fontWeight: 800, 
                          fontSize: '0.95rem', 
                          mt: 0.5,
                          color: balance > 0 ? 'error.main' : 'success.main' 
                        }}>
                          ₹{balance.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Due Date: {new Date(invoice.due_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <IconButton component={Link} href={`/invoices/${invoice.id}`} size="small" sx={{ bgcolor: alpha(theme.palette.text.primary, 0.05) }}>
                          <Eye size={16} />
                        </IconButton>
                        <IconButton size="small" sx={{ bgcolor: alpha(theme.palette.text.primary, 0.05) }}>
                          <Download size={16} />
                        </IconButton>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
