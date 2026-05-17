-- Migration: Add excess_payment column to tenants table to track credit balance / overpayments
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS excess_payment DECIMAL(12, 2) DEFAULT 0;
