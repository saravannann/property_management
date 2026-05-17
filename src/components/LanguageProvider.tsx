'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Locale = 'en' | 'ta';

// Helper to sync Google Translate Cookie
const syncGoogleTranslateCookie = (lang: Locale) => {
  const domain = window.location.hostname;
  document.cookie = `googtrans=/en/${lang}; path=/;`;
  document.cookie = `googtrans=/en/${lang}; path=/; domain=${domain};`;
  if (domain !== 'localhost') {
    const parts = domain.split('.');
    if (parts.length > 2) {
      const parentDomain = parts.slice(-2).join('.');
      document.cookie = `googtrans=/en/${lang}; path=/; domain=.${parentDomain};`;
    }
  }
};

export const translations = {
  en: {
    common: {
      dashboard: "Dashboard",
      properties: "Properties",
      tenants: "Tenants",
      invoices: "Invoices",
      welcome: "Welcome back! Here's what's happening with your properties.",
      search: "Search...",
      clearFilters: "Clear Filters",
      status: "Status",
      actions: "Actions",
      save: "Save",
      cancel: "Cancel",
      loading: "Loading...",
      settings: "Settings",
      users: "Users"
    },
    dashboard: {
      occupancy: "Occupancy Rate",
      vacantUnits: "Vacant Units",
      revenue: "Revenue",
      pendingAmount: "Pending Amount",
      totalAdvance: "Total Advance",
      highRisk: "High Risk Tenants",
      smartInsight: "Smart Insight",
      quickActions: "Quick Actions",
      recentActivity: "Recent Activity",
      noActivity: "No recent activity found.",
      generateInvoices: "Generate Monthly Invoices",
      pendingRequests: "Pending Tenant Requests",
      updateMedia: "Update Property Media"
    },
    invoices: {
      title: "Invoices",
      invoiceId: "Invoice ID",
      tenant: "Tenant",
      amount: "Amount",
      balanceDue: "Balance Due",
      dueDate: "Due Date",
      createInvoice: "Create Invoice",
      noInvoices: "No invoices found matching your filters.",
      propertyFilter: "Property",
      tenantFilter: "Tenant",
      monthFilter: "Month",
      allMonths: "All Months",
      allTenants: "All Tenants",
      allProperties: "All Properties"
    },
    tenants: {
      title: "Tenants",
      subtitle: "Manage residents and lease agreements.",
      addTenant: "Add Tenant",
      allStatus: "All Status",
      active: "Active",
      inactive: "Inactive",
      contactInfo: "Contact Info",
      propertyUnit: "Property / Unit",
      monthlyRent: "Monthly Rent",
      moveIn: "Move-in",
      agreement: "Agreement"
    },
    properties: {
      title: "Properties",
      subtitle: "Manage your real estate portfolio, units, and managers.",
      addProperty: "Add Property",
      totalUnits: "Total Units",
      occupied: "Occupied",
      vacant: "Vacant",
      type: "Type",
      editProperty: "Edit Property",
      deleteProperty: "Delete Property",
      manageTenants: "Manage Tenants"
    }
  },
  ta: {
    common: {
      dashboard: "தகவல்தளம்",
      properties: "சொத்துக்கள்",
      tenants: "வாடகையாளர்கள்",
      invoices: "விலைப்பட்டியல்கள்",
      welcome: "நல்வரவு! உங்கள் சொத்துக்களின் தற்போதைய நிலை.",
      search: "தேடுக...",
      clearFilters: "வடிகட்டிகளை நீக்குக",
      status: "நிலை",
      actions: "செயல்கள்",
      save: "சேமி",
      cancel: "ரத்து செய்",
      loading: "ஏற்றப்படுகிறது...",
      settings: "அமைப்புகள்",
      users: "பயனர்கள்"
    },
    dashboard: {
      occupancy: "குடியேற்ற வீதம்",
      vacantUnits: "காலியான வீடுகள்",
      revenue: "வருவாய்",
      pendingAmount: "நிலுவைத் தொகை",
      totalAdvance: "மொத்த முன்பணம்",
      highRisk: "கடன் அபாயமுள்ள வாடகையாளர்கள்",
      smartInsight: "நுண்ணறிவுத் தகவல்",
      quickActions: "விரைவுச் செயல்கள்",
      recentActivity: "சமீபத்திய நடவடிக்கைகள்",
      noActivity: "நடவடிக்கைகள் ஏதும் இல்லை.",
      generateInvoices: "மாதாந்திர ரசீதுகள் தயாரித்தல்",
      pendingRequests: "வாடகையாளரின் நிலுவைக் கோரிக்கைகள்",
      updateMedia: "சொத்து புகைப்படங்கள் மாற்றுதல்"
    },
    invoices: {
      title: "விலைப்பட்டியல்கள்",
      invoiceId: "ரசீது எண்",
      tenant: "வாடகையாளர்",
      amount: "தொகை",
      balanceDue: "மீதமுள்ள தொகை",
      dueDate: "கடைசி தேதி",
      createInvoice: "ரசீது உருவாக்கு",
      noInvoices: "உங்கள் தேடலுக்கு ஏற்ற ரசீதுகள் இல்லை.",
      propertyFilter: "சொத்து",
      tenantFilter: "வாடகையாளர்",
      monthFilter: "மாதம்",
      allMonths: "அனைத்து மாதங்கள்",
      allTenants: "அனைத்து வாடகையாளர்கள்",
      allProperties: "அனைத்து சொத்துக்கள்"
    },
    tenants: {
      title: "வாடகையாளர்கள்",
      subtitle: "குடியிருப்பாளர்கள் மற்றும் குத்தகை ஒப்பந்தங்களை நிர்வகிக்கவும்.",
      addTenant: "வாடகையாளர் சேர்",
      allStatus: "அனைத்து நிலை",
      active: "செயலில் உள்ளவர்",
      inactive: "செயலற்றவர்",
      contactInfo: "தொடர்பு விபரம்",
      propertyUnit: "சொத்து / கதவு எண்",
      monthlyRent: "மாத வாடகை",
      moveIn: "குடியேறிய நாள்",
      agreement: "ஒப்பந்தம்"
    },
    properties: {
      title: "சொத்துக்கள்",
      subtitle: "உங்கள் ரியல் எஸ்டேட் சொத்துக்கள், வீடுகள் மற்றும் மேலாளர்களை நிர்வகிக்கவும்.",
      addProperty: "சொத்து சேர்",
      totalUnits: "மொத்த வீடுகள்",
      occupied: "வாடகையிலுள்ளவை",
      vacant: "காலியாக உள்ளவை",
      type: "வகை",
      editProperty: "சொத்து விபரம் மாற்று",
      deleteProperty: "சொத்தை நீக்கு",
      manageTenants: "வாடகையாளர்களை நிர்வகி"
    }
  }
};

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslationKeys = NestedKeyOf<typeof translations.en>;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key.toString(),
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    // 1. Initial LocalStorage Sync for rapid render
    const savedLocale = localStorage.getItem('app-locale') as Locale;
    if (savedLocale === 'en' || savedLocale === 'ta') {
      setLocaleState(savedLocale);
      syncGoogleTranslateCookie(savedLocale);
    }

    // 2. Fetch authenticated user profile settings from Supabase database
    const syncDbLocale = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('language')
            .eq('id', user.id)
            .single();

          if (!error && profile?.language && (profile.language === 'en' || profile.language === 'ta')) {
            const dbLocale = profile.language as Locale;
            if (dbLocale !== savedLocale) {
              localStorage.setItem('app-locale', dbLocale);
              setLocaleState(dbLocale);
              syncGoogleTranslateCookie(dbLocale);
              
              // Force translation scanner reload if mismatch detected
              window.location.reload();
            }
          }
        }
      } catch (err) {
        console.error('Error syncing user profile locale from Supabase:', err);
      }
    };
    syncDbLocale();
  }, []);

  const setLocale = async (newLocale: Locale) => {
    // Immediately update local UI state & cookie for fast feedback
    setLocaleState(newLocale);
    localStorage.setItem('app-locale', newLocale);
    syncGoogleTranslateCookie(newLocale);

    // Save locale selection to user profile in Supabase database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ language: newLocale })
          .eq('id', user.id);
      }
    } catch (err) {
      console.error('Error saving user profile locale choice to Supabase:', err);
    }

    // Force page reload so Google Translate automatically re-scans the DOM with the new language
    window.location.reload();
  };

  const t = (key: TranslationKeys): string => {
    try {
      const keys = key.split('.');
      let current: any = translations[locale];
      for (const k of keys) {
        if (current[k] === undefined) {
          // Fallback to English
          let fallback: any = translations['en'];
          for (const fk of keys) {
            fallback = fallback[fk];
          }
          return fallback || key;
        }
        current = current[k];
      }
      return current;
    } catch {
      return key;
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
