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
  CircularProgress
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
  AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { supabase } from '@/lib/supabase';

export default function InvoicesPage() {
  const theme = useTheme();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return <CheckCircle2 size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'overdue': return <AlertCircle size={14} />;
      default: return undefined;
    }
  };

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
          placeholder="Search by invoice number or tenant..."
          sx={{ ml: 2, flex: 1, color: 'text.primary', fontSize: '0.95rem' }}
        />
        <IconButton size="small"><Filter size={18} /></IconButton>
      </Box>

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
            ) : invoices.map((invoice) => (
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
                  <IconButton size="small" title="View PDF"><Eye size={18} /></IconButton>
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
