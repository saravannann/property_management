'use client';
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
  alpha
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
  MoreHorizontal 
} from "lucide-react";
import Link from "next/link";

export default function TenantsPage() {
  const tenants = [
    {
      id: "1",
      name: "Rahul Sharma",
      email: "rahul.s@example.com",
      phone: "+91 98765 43210",
      property: "Emerald Heights",
      unit: "4B",
      rent: "₹35,000",
      status: "Active",
      moveIn: "Jan 12, 2024",
    },
    {
      id: "2",
      name: "Priya Singh",
      email: "priya.singh@example.com",
      phone: "+91 87654 32109",
      property: "Sapphire Villas",
      unit: "V2",
      rent: "₹85,000",
      status: "Active",
      moveIn: "Mar 05, 2024",
    },
    {
      id: "3",
      name: "Amit Patel",
      email: "amit.p@example.com",
      phone: "+91 76543 21098",
      property: "Crystal Plaza",
      unit: "Suite 101",
      rent: "₹1,20,000",
      status: "Late Payment",
      moveIn: "Nov 20, 2023",
    },
  ];

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
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<Filter size={18} />}>
            Filter
          </Button>
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
            {tenants.map((tenant) => (
              <TableRow key={tenant.id} sx={{ '&:hover': { bgcolor: alpha('#fff', 0.01) } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha('#6366f1', 0.1), color: 'primary.main', fontWeight: 700 }}>
                      {tenant.name.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{tenant.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Move-in: {tenant.moveIn}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                      <Phone size={14} color="#818cf8" />
                      <Typography variant="caption">{tenant.phone}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                      <Mail size={14} color="#818cf8" />
                      <Typography variant="caption">{tenant.email}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Home size={16} style={{ color: '#c084fc' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{tenant.property}</Typography>
                    <Chip label={tenant.unit} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{tenant.rent}</Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={tenant.status} 
                    size="small"
                    color={tenant.status === 'Active' ? 'success' : 'warning'}
                    variant="outlined"
                    sx={{ 
                      fontWeight: 800, 
                      fontSize: '0.65rem',
                      bgcolor: alpha(tenant.status === 'Active' ? '#10b981' : '#f59e0b', 0.1),
                      color: tenant.status === 'Active' ? '#10b981' : '#f59e0b',
                      border: 'none'
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small"><ShieldCheck size={18} /></IconButton>
                  <IconButton size="small"><MoreHorizontal size={18} /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
