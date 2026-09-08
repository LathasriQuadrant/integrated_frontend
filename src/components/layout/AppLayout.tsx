// import { ReactNode } from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuth } from '@/contexts/AuthContext';
// import Header from './Header';
// import { Loader2 } from 'lucide-react';

// interface AppLayoutProps {
//   children: ReactNode;
// }

// const AppLayout = ({ children }: AppLayoutProps) => {
//   const { isAuthenticated, isLoading } = useAuth();

//   if (isLoading) {
//     return (
//       <div className="h-screen flex items-center justify-center bg-background">
//         <Loader2 className="w-8 h-8 animate-spin text-primary" />
//       </div>
//     );
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   return (
//     <div className="h-screen flex flex-col bg-background overflow-hidden">
//       <Header />
//       <main className="flex-1 overflow-auto p-6">{children}</main>
//     </div>
//   );
// };

// export default AppLayout;

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';
import { Loader2 } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  // ✅ ADDED LOGGING - fires on every render of AppLayout, so we can see
  // exactly what isAuthenticated/isLoading were at the moment a guard fires.
  console.log("🟡 AppLayout render:", {
    isAuthenticated,
    isLoading,
    path: window.location.pathname,
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // ✅ ADDED LOGGING
    console.warn("🟡 AppLayout: NOT authenticated - redirecting to /login", {
      path: window.location.pathname,
    });
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
};

export default AppLayout;
