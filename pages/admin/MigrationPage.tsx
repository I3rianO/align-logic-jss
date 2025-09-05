import React from 'react';
import { MigrationRunner } from '@/components/MigrationRunner';
import MainLayout from '@/components/layout/MainLayout';

/**
 * Migration Page - Admin page for running data migration
 */
export const MigrationPage: React.FC = () => {
  return (
    <MainLayout>
      <MigrationRunner />
    </MainLayout>
  );
};