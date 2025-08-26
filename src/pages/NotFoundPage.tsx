import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

function NotFoundPage() {
  const navigate = useNavigate();
  
  const goBack = () => {
    navigate('/');
  };

  return (
    <MainLayout showHeader={false}>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="space-y-6">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-3xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Button onClick={goBack} className="mt-4">
            <ChevronLeft size={18} className="mr-2" /> Return Home
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

export default NotFoundPage;