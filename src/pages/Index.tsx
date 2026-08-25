import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LandingPage from './LandingPage';

const Index = () => {
  const { isAuthenticated } = useAuth();

  // Show landing page for unauthenticated users
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Redirect to dashboard for authenticated users
  return <Navigate to="/dashboard" replace />;
};

export default Index;