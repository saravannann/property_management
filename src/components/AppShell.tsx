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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from 'next/navigation';

const drawerWidth = 260;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={22} />, href: "/" },
    { label: "Properties", icon: <Building2 size={22} />, href: "/properties" },
    { label: "Tenants", icon: <Users size={22} />, href: "/tenants" },
    { label: "Invoices", icon: <Receipt size={22} />, href: "/invoices" },
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
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
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
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
                <Settings size={22} />
              </ListItemIcon>
              <ListItemText 
                primary={<Typography sx={{ fontWeight: 500 }}>Settings</Typography>} 
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Main App Bar and Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AppBar 
          position="static" 
          color="transparent" 
          elevation={0} 
          sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: alpha('#fff', 0.03), 
              px: 2, 
              py: 0.75, 
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.05)',
              width: { xs: '100%', md: 400 },
              mr: 2
            }}>
              <Search size={18} style={{ color: alpha('#f8fafc', 0.5) }} />
              <InputBase
                placeholder="Search dashboard..."
                sx={{ ml: 1.5, flex: 1, color: 'text.primary', fontSize: '0.875rem' }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton sx={{ color: 'text.secondary' }}>
                <Badge variant="dot" color="primary">
                  <Bell size={20} />
                </Badge>
              </IconButton>
              <Avatar 
                sx={{ 
                  bgcolor: 'primary.main', 
                  width: 36, 
                  height: 36,
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)'
                }}
              >
                JD
              </Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, overflowY: 'auto' }}>
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
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        justifyContent: 'space-around',
        py: 1.5,
        zIndex: 1000
      }}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.label} href={item.href} style={{ textDecoration: 'none', textAlign: 'center' }}>
              <Box sx={{ color: active ? 'primary.main' : 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                {item.icon}
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>
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
