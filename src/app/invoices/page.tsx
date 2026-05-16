'use client';
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
  useTheme
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

export default function InvoicesPage() {
  const theme = useTheme();

  const invoices = [
    {
      id: "INV-2024-001",
      tenant: "Rahul Sharma",
      amount: "₹35,000",
      date: "May 01, 2024",
      dueDate: "May 10, 2024",
      status: "Paid",
    },
    {
      id: "INV-2024-002",
      tenant: "Priya Singh",
      amount: "₹85,000",
      date: "May 01, 2024",
      dueDate: "May 10, 2024",
      status: "Pending",
    },
    {
      id: "INV-2024-003",
      tenant: "Amit Patel",
      amount: "₹1,20,000",
      date: "May 01, 2024",
      dueDate: "May 05, 2024",
      status: "Overdue",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Pending': return 'warning';
      case 'Overdue': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle2 size={14} />;
      case 'Pending': return <Clock size={14} />;
      case 'Overdue': return <AlertCircle size={14} />;
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
          { label: "Total Collected", value: "₹12,45,000", color: '#10b981' },
          { label: "Pending Amount", value: "₹2,15,000", color: '#f59e0b' },
          { label: "Overdue Amount", value: "₹85,000", color: '#ef4444' }
        ].map((stat, i) => (
          <Grid size={{ xs: 12, md: 4 }} key={i}>
            <Card sx={{ borderLeft: `4px solid ${stat.color}` }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: 1 }}>
                  {stat.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                  {stat.value}
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
            {invoices.map((invoice) => (
              <TableRow key={invoice.id} sx={{ '&:hover': { bgcolor: alpha('#fff', 0.01) } }}>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.light' }}>
                  {invoice.id}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{invoice.tenant}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{invoice.amount}</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{invoice.dueDate}</TableCell>
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
                      bgcolor: alpha(
                        invoice.status === 'Paid' ? '#10b981' : 
                        invoice.status === 'Pending' ? '#f59e0b' : '#ef4444', 
                        0.1
                      ),
                      color: 
                        invoice.status === 'Paid' ? '#10b981' : 
                        invoice.status === 'Pending' ? '#f59e0b' : '#ef4444',
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
