'use client';

import React from 'react';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  List, 
  Typography, 
  Divider, 
  IconButton, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Avatar,
  InputBase,
  Badge,
  alpha,
  useTheme
} from '@mui/material';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Receipt, 
  Settings, 
  Search, 
  Bell,
  Shield,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useColorMode } from './Providers';

const drawerWidth = 260;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const colorMode = useColorMode();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPage = pathname === '/login' || pathname === '/setup-admin';

  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [userName, setUserName] = React.useState<string>('John Doe');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  React.useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !isPublicPage) {
        router.push('/login');
        return;
      }
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role || 'manager');
          setUserName(profile.full_name || session.user.email?.split('@')[0] || 'User');
        }
      }
    };
    checkUser();
  }, [isPublicPage, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (isPublicPage) {
    return <>{children}</>;
  }

  const navItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/" },
    { label: "Properties", icon: <Building2 size={20} />, href: "/properties" },
    { label: "Tenants", icon: <Users size={20} />, href: "/tenants" },
    { label: "Invoices", icon: <Receipt size={20} />, href: "/invoices" },
  ];

  if (userRole === 'admin') {
    navItems.push({ label: "Users", icon: <Shield size={20} />, href: "/settings/users" });
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar (Existing Desktop Drawer code here...) */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box sx={{ p: 4 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 800, 
              background: 'linear-gradient(90deg, #818cf8 0%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            PropManager
          </Typography>
        </Box>
        <List sx={{ px: 2, flex: 1 }}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <ListItem key={item.label} disablePadding sx={{ mb: 1 }}>
                <ListItemButton 
                  component={Link} 
                  href={item.href}
                  selected={active}
                  sx={{ 
                    borderRadius: 2,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      '& .MuiListItemIcon-root': { color: 'primary.main' }
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 44, color: active ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography sx={{ 
                        fontWeight: active ? 700 : 500, 
                        fontSize: '0.95rem',
                        color: active ? 'primary.main' : 'inherit'
                      }}>
                        {item.label}
                      </Typography>
                    } 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Divider sx={{ mx: 2, opacity: 0.5 }} />
        <List sx={{ px: 2, pb: 4 }}>
          <ListItem disablePadding>
            <ListItemButton component={Link} href="/settings" sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 44, color: 'text.secondary' }}>
                <Settings size={20} />
              </ListItemIcon>
              <ListItemText 
                primary={<Typography sx={{ fontWeight: 500 }}>Settings</Typography>} 
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, color: 'error.main' }}>
              <ListItemIcon sx={{ minWidth: 44, color: 'error.main' }}>
                <LogOut size={20} />
              </ListItemIcon>
              <ListItemText 
                primary={<Typography sx={{ fontWeight: 600 }}>Logout</Typography>} 
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', pb: { xs: 8, md: 0 } }}>
        <AppBar 
          position="static" 
          color="transparent" 
          elevation={0} 
          sx={{ borderBottom: `1px solid ${theme.palette.divider}`, backdropFilter: 'blur(10px)' }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1.5, md: 4 }, minHeight: { xs: 56, md: 64 } }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.03) : alpha('#000', 0.03), 
              px: 2, 
              py: 0.5, 
              borderRadius: 10,
              border: `1px solid ${theme.palette.divider}`,
              width: { xs: '100%', md: 400 },
              mr: 2
            }}>
              <Search size={16} style={{ color: theme.palette.text.secondary }} />
              <InputBase
                placeholder="Search..."
                sx={{ ml: 1, flex: 1, color: 'text.primary', fontSize: '0.85rem' }}
              />
            </Box>

            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
              <IconButton 
                onClick={colorMode.toggleColorMode} 
                sx={{ color: 'text.secondary' }}
              >
                {theme.palette.mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </IconButton>
              <Avatar 
                sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.8rem', fontWeight: 700 }}
              >
                {getInitials(userName)}
              </Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, p: { xs: 1.5, md: 4 }, overflowY: 'auto' }}>
          {children}
        </Box>
      </Box>

      {/* Mobile Navigation */}
      <Box sx={{ 
        display: { xs: 'flex', md: 'none' }, 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        bgcolor: 'background.paper',
        borderTop: `1px solid ${theme.palette.divider}`,
        justifyContent: 'space-around',
        py: 1,
        zIndex: 1000,
        boxShadow: '0 -4px 10px rgba(0,0,0,0.05)'
      }}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.label} href={item.href} style={{ textDecoration: 'none', textAlign: 'center', flex: 1 }}>
              <Box sx={{ color: active ? 'primary.main' : 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                {item.icon}
                <Typography variant="caption" sx={{ fontWeight: active ? 700 : 500, fontSize: '0.6rem' }}>
                  {item.label}
                </Typography>
              </Box>
            </Link>
          );
        })}
      </Box>
    </Box>
  );
}
