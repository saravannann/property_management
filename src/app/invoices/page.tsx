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
  InputLabel
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

  const [stats, setStats] = useState({
    totalCollected: 0,
    pendingAmount: 0,
    overdueAmount: 0
  });

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

      // Calculate stats
      const collected = data?.filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
      
      const pending = data?.filter(inv => inv.status === 'pending')
        .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
      
      const overdue = data?.filter(inv => inv.status === 'overdue')
        .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

      setStats({
        totalCollected: collected,
        pendingAmount: pending,
        overdueAmount: overdue
      });
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

  // Compute unique filter options dynamically from the loaded invoices
  const uniqueProperties = Array.from(new Set(invoices.map(inv => inv.property_id))).map(id => {
    const inv = invoices.find(i => i.property_id === id);
    return { id, name: inv?.properties?.name || 'Unknown' };
  }).filter(p => p.id);

  const uniqueMonths = Array.from(new Set(invoices.map(inv => inv.billing_date))).filter(Boolean).sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());

  const uniqueTenants = Array.from(new Set(invoices.map(inv => inv.tenant_id))).map(id => {
    const inv = invoices.find(i => i.tenant_id === id);
    return { id, name: inv?.tenants?.name || 'Unknown' };
  }).filter(t => t.id);

  // Apply filters to invoices
  const filteredInvoices = invoices.filter(inv => {
    let match = true;
    if (filterPropertyId && inv.property_id !== filterPropertyId) match = false;
    if (filterTenantId && inv.tenant_id !== filterTenantId) match = false;
    if (filterMonth && inv.billing_date !== filterMonth) match = false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const num = (inv.invoice_number || '').toLowerCase();
      const tenant = (inv.tenants?.name || '').toLowerCase();
      if (!num.includes(q) && !tenant.includes(q)) match = false;
    }
    return match;
  });

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Invoices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage billing, tracking, and financial history.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<Download size={18} />}>
            Export
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Plus size={18} />}
            component={Link}
            href="/invoices/add"
          >
            Create Invoice
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Collected", value: `₹${stats.totalCollected.toLocaleString()}`, color: '#10b981' },
          { label: "Pending Amount", value: `₹${stats.pendingAmount.toLocaleString()}`, color: '#f59e0b' },
          { label: "Overdue Amount", value: `₹${stats.overdueAmount.toLocaleString()}`, color: '#ef4444' }
        ].map((stat, i) => (
          <Grid size={{ xs: 12, md: 4 }} key={i}>
            <Card sx={{ borderLeft: `4px solid ${stat.color}`, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: 1 }}>
                  {stat.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
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
                  {uniqueMonths.map((m: any) => <MenuItem key={m} value={m}>{new Date(m).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</MenuItem>)}
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

      <TableContainer component={Card}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: alpha('#fff', 0.02) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Invoice ID</TableCell>
              <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Tenant</TableCell>
              <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Due Date</TableCell>
              <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
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
  );
}
