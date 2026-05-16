'use client';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack,
  alpha,
  useTheme
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
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const theme = useTheme();

  const stats = [
    { 
      label: "Total Properties", 
      value: "12", 
      icon: <Building2 size={24} />, 
      trend: "+2 this month",
      trendUp: true,
      color: theme.palette.primary.main
    },
    { 
      label: "Active Tenants", 
      value: "48", 
      icon: <Users size={24} />, 
      trend: "+5 this month",
      trendUp: true,
      color: theme.palette.secondary.main
    },
    { 
      label: "Monthly Revenue", 
      value: "₹4,25,000", 
      icon: <TrendingUp size={24} />, 
      trend: "+12% vs last month",
      trendUp: true,
      color: '#10b981' // emerald-500
    },
    { 
      label: "Pending Invoices", 
      value: "08", 
      icon: <Receipt size={24} />, 
      trend: "-2 vs last month",
      trendUp: false,
      color: '#f59e0b' // amber-500
    },
  ];

  const recentActivity = [
    { title: "Invoice Paid", description: "Rahul Sharma paid rent for Unit 4B", time: "2 hours ago", status: 'success' },
    { title: "New Tenant", description: "Priya Singh added to Emerald Heights", time: "5 hours ago", status: 'info' },
    { title: "Maintenance Alert", description: "Water leakage reported in Unit 2A", time: "1 day ago", status: 'warning' },
    { title: "Agreement Expiring", description: "Unit 1C agreement expires in 15 days", status: 'error', time: "2 days ago" },
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
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />}
          component={Link}
          href="/properties/add"
        >
          Add Property
        </Button>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, i) => (
          <Grid item xs={12} sm={6} lg={3} key={i}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2.5, 
                    bgcolor: alpha(stat.color, 0.1), 
                    color: stat.color,
                    display: 'flex'
                  }}>
                    {stat.icon}
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5, 
                    color: stat.trendUp ? 'success.main' : 'warning.main',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {stat.trend}
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Recent Activity */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Activity</Typography>
                <Button variant="text" endIcon={<ArrowRight size={16} />} size="small">
                  View All
                </Button>
              </Box>
              <Stack spacing={4}>
                {recentActivity.map((activity, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 2.5 }}>
                    <Box sx={{ 
                      width: 10, 
                      height: 10, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.main', 
                      mt: 0.75,
                      boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)'
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
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Insights */}
        <Grid item xs={12} lg={4}>
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
                  <Button variant="text" fullWidth sx={{ justifyContent: 'start', py: 1.5, bgcolor: alpha('#fff', 0.02) }} startIcon={<Receipt size={18} color="#f59e0b" />}>
                    Generate Monthly Invoices
                  </Button>
                  <Button variant="text" fullWidth sx={{ justifyContent: 'start', py: 1.5, bgcolor: alpha('#fff', 0.02) }} startIcon={<Users size={18} color="#6366f1" />}>
                    Pending Tenant Requests
                  </Button>
                  <Button variant="text" fullWidth sx={{ justifyContent: 'start', py: 1.5, bgcolor: alpha('#fff', 0.02) }} startIcon={<Building2 size={18} color="#c084fc" />}>
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
