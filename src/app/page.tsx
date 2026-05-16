'use client';
import React from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack,
  alpha,
  useTheme,
  CircularProgress
} from '@mui/material';
import { 
  Building2, 
  Users, 
  Receipt, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Plus,
  ArrowRight,
  Home,
  Percent,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const theme = useTheme();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState({
    propertyCount: 0,
    tenantCount: 0,
    totalRevenue: 0,
    totalAdvance: 0,
    pendingInvoices: 0,
    pendingAmount: 0,
    vacantApartments: 0,
    vacantCommercial: 0,
    occupancyRate: 0,
    recentActivity: [] as any[]
  });

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch User Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        // 2. Fetch Properties with their tenant counts
        let query = supabase
          .from('properties')
          .select('id, name, property_type, total_units, created_at, tenants:tenants(count)');
        
        if (profile?.role !== 'admin') {
          query = query.or(`owner_id.eq.${user.id},assigned_managers.cs.{${user.id}}`);
        }

        const { data: props, error: propsError } = await query;
        if (propsError) throw propsError;
        
        const propertyCount = props?.length || 0;
        const propertyIds = props?.map(p => p.id) || [];
        
        let vacantApartments = 0;
        let vacantCommercial = 0;
        let tenantCount = 0;
        let totalUnits = 0;

        props?.forEach(p => {
          const type = (p.property_type || '').toLowerCase();
          const total = Number(p.total_units) || 0;
          const occupied = p.tenants?.[0]?.count || 0;
          const vacant = Math.max(0, total - occupied);

          totalUnits += total;
          tenantCount += occupied;

          if (type.includes('apartment') || type.includes('villa')) {
            vacantApartments += vacant;
          } else {
            vacantCommercial += vacant;
          }
        });

        const occupancyRate = totalUnits > 0 ? Math.round((tenantCount / totalUnits) * 100) : 0;

        // 3. Calculate Revenue & Advance (Only for properties visible to this user)
        let totalRevenue = 0;
        let totalAdvance = 0;
        if (propertyIds.length > 0) {
          const { data: activeTenants } = await supabase
            .from('tenants')
            .select('monthly_rent, security_deposit')
            .eq('is_active', true)
            .in('property_id', propertyIds);
          
          totalRevenue = activeTenants?.reduce((acc, t) => acc + Number(t.monthly_rent), 0) || 0;
          totalAdvance = activeTenants?.reduce((acc, t) => acc + Number(t.security_deposit || 0), 0) || 0;
        }

        // 4. Pending Invoices & Amount (Only for properties visible to this user)
        let pendingInvoices = 0;
        let pendingAmount = 0;
        if (propertyIds.length > 0) {
          const { data: invData, count } = await supabase
            .from('invoices')
            .select('amount', { count: 'exact' })
            .eq('status', 'pending')
            .in('property_id', propertyIds);
          
          pendingInvoices = count || 0;
          pendingAmount = invData?.reduce((acc, inv) => acc + Number(inv.amount), 0) || 0;
        }

        // 5. Recent Activity (Filtered by visible properties)
        const recentActivity = props
          ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4)
          .map(p => ({
            title: "Property Added",
            description: `${p.name} was added to your portfolio`,
            time: new Date(p.created_at).toLocaleDateString(),
            status: 'success'
          })) || [];

        setData({
          propertyCount,
          tenantCount,
          totalRevenue,
          totalAdvance,
          pendingInvoices,
          pendingAmount,
          vacantApartments,
          vacantCommercial,
          occupancyRate,
          recentActivity
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    { 
      label: "Properties", 
      value: data.propertyCount.toString(), 
      icon: <Building2 size={18} />, 
      color: theme.palette.primary.main,
      path: '/properties'
    },
    { 
      label: "Tenants", 
      value: data.tenantCount.toString(), 
      icon: <Users size={18} />, 
      color: theme.palette.secondary.main,
      path: '/tenants'
    },
    { 
      label: "Occupancy Rate", 
      value: `${data.occupancyRate}%`, 
      icon: <Percent size={18} />, 
      color: '#8b5cf6', // Violet
      path: '/properties'
    },
    { 
      label: "Vacant Units", 
      isSplit: true,
      apartments: data.vacantApartments,
      commercial: data.vacantCommercial,
      icon: <Home size={18} />, 
      color: '#f59e0b', // Amber
      path: '/properties'
    },
    { 
      label: "Revenue", 
      value: `₹${(data.totalRevenue || 0).toLocaleString()}`, 
      icon: <TrendingUp size={18} />, 
      color: '#10b981', // Emerald
      path: '/invoices'
    },
    { 
      label: "Pending Amount", 
      value: `₹${(data.pendingAmount || 0).toLocaleString()}`, 
      icon: <Clock size={18} />, 
      color: '#f59e0b', // Amber
      path: '/invoices'
    },
    { 
      label: "Total Advance", 
      value: `₹${(data.totalAdvance || 0).toLocaleString()}`, 
      icon: <Wallet size={18} />, 
      color: '#ec4899', // Pink
      path: '/tenants'
    },
  ];

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Insights and management for your property portfolio.
          </Typography>
        </Box>
        <Link href="/properties/add" style={{ textDecoration: 'none' }}>
          <Button 
            variant="contained" 
            startIcon={<Plus size={18} />}
          >
            Add Property
          </Button>
        </Link>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 6 }}>
        {stats.map((stat, i) => (
          <Grid size={{ xs: 6, sm: 6, lg: 3 }} key={i}>
            <Link href={stat.path} style={{ textDecoration: 'none' }}>
              <Card sx={{ 
                height: '100%', 
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: `0 12px 24px -10px ${alpha(stat.color, 0.3)}`,
                  borderColor: alpha(stat.color, 0.5),
                  '& .stat-icon': {
                    transform: 'scale(1.1)',
                    bgcolor: alpha(stat.color, 0.2)
                  }
                }
              }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: { xs: 1, sm: 2 } }}>
                    <Box className="stat-icon" sx={{ 
                      p: { xs: 0.8, sm: 1.2 }, 
                      borderRadius: 1.5, 
                      bgcolor: alpha(stat.color, 0.1), 
                      color: stat.color,
                      display: 'flex',
                      transition: 'all 0.3s ease'
                    }}>
                      {stat.icon}
                    </Box>
                  </Box>
                  
                  {stat.isSplit ? (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1.5, fontSize: { xs: '0.65rem', sm: '0.875rem' }, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {stat.label}
                      </Typography>
                      <Stack 
                        direction="column" 
                        spacing={1} 
                        sx={{ alignItems: 'flex-start' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                            {loading ? <CircularProgress size={12} /> : stat.apartments}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.6rem' }}>APT</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                            {loading ? <CircularProgress size={12} /> : stat.commercial}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.6rem' }}>COM</Typography>
                        </Box>
                      </Stack>
                    </>
                  ) : (
                    <>
                      <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.2, fontSize: { xs: '1.1rem', sm: '2.125rem' } }}>
                        {loading ? <CircularProgress size={16} /> : stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                        {stat.label}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Recent Activity */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Activity</Typography>
                <Button variant="text" endIcon={<ArrowRight size={16} />} size="small">
                  View All
                </Button>
              </Box>
              <Stack spacing={4}>
                {loading ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : data.recentActivity.length > 0 ? (
                  data.recentActivity.map((activity, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 2.5 }}>
                      <Box sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main', 
                        mt: 0.75,
                        boxShadow: theme.palette.mode === 'dark' ? '0 0 10px rgba(99, 102, 241, 0.5)' : 'none'
                      }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {activity.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Clock size={12} />
                            {activity.time}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {activity.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No recent activity found.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Insights */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), border: '1px dashed', borderColor: 'primary.main' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                  Smart Insight
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, mb: 2, fontWeight: 500, fontStyle: 'italic' }}>
                  "Unit 4B occupancy has been 100% for the last 12 months. Consider a lease renewal review."
                </Typography>
                <Button variant="outlined" fullWidth size="small">
                  Review Lease
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Quick Actions</Typography>
                <Stack spacing={1.5}>
                  <Button variant="text" fullWidth sx={{ justifyContent: 'start', py: 1.5, bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha('#000', 0.02) }} startIcon={<Receipt size={18} color="#f59e0b" />}>
                    Generate Monthly Invoices
                  </Button>
                  <Button variant="text" fullWidth sx={{ justifyContent: 'start', py: 1.5, bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha('#000', 0.02) }} startIcon={<Users size={18} color="#6366f1" />}>
                    Pending Tenant Requests
                  </Button>
                  <Button variant="text" fullWidth sx={{ justifyContent: 'start', py: 1.5, bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha('#000', 0.02) }} startIcon={<Building2 size={18} color="#c084fc" />}>
                    Update Property Media
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
