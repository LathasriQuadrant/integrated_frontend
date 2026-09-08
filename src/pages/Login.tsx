// import { useState, useEffect, useCallback } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Shield, Zap, Clock, ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";

// const BACKEND_BASE_URL = "https://accesstokens-aecjbzaqaqcuh6bd.eastus-01.azurewebsites.net";
// const LOGIN_URL = `${BACKEND_BASE_URL}/login`;

// const Login = () => {
//   const navigate = useNavigate();
//   const { isAuthenticated, checkAuth } = useAuth();
//   const [isWaiting, setIsWaiting] = useState(false);
//   const [loginWindow, setLoginWindow] = useState<Window | null>(null);

//   // Redirect if already authenticated
//   useEffect(() => {
//     if (isAuthenticated) {
//       navigate("/dashboard", { replace: true });
//     }
//   }, [isAuthenticated, navigate]);

//   // Check if auth completed via backend or localStorage (cross-tab)
//   const checkAuthCompletion = useCallback(async () => {
//     // First check localStorage (set by PowerBIAuthSuccess in the popup)
//     const localAuth = localStorage.getItem("powerbi_authenticated");
//     if (localAuth === "true") {
//       const userDetails = localStorage.getItem("user_details");
//       if (userDetails) {
//         const { name, email, oid, tenant } = JSON.parse(userDetails);
//         sessionStorage.setItem("powerbi_authenticated", "true");
//         const cleanName = (name || "User").replace(/\s*\(.*?\)\s*$/, "").trim();
//         sessionStorage.setItem("azure_user_name", cleanName);
//         sessionStorage.setItem("azure_user_email", email || "");
//         sessionStorage.setItem("azure_user_oid", oid || "");
//         sessionStorage.setItem("azure_user_tenant", tenant || "");
//       }
//       // Clean up localStorage flags
//       localStorage.removeItem("powerbi_authenticated");
//       localStorage.removeItem("user_details");
//       await checkAuth();
//       navigate("/dashboard", { replace: true });
//       return true;
//     }

//     // Fallback: try backend session check
//     const isAuthed = await checkAuth();
//     if (isAuthed) {
//       navigate("/dashboard", { replace: true });
//       return true;
//     }
//     return false;
//   }, [checkAuth, navigate]);

//   // Listen for storage events from the popup tab
//   useEffect(() => {
//     const handleStorageChange = (e: StorageEvent) => {
//       if (e.key === "powerbi_authenticated" && e.newValue === "true") {
//         checkAuthCompletion();
//       }
//     };
//     window.addEventListener("storage", handleStorageChange);
//     return () => window.removeEventListener("storage", handleStorageChange);
//   }, [checkAuthCompletion]);

//   // Poll for authentication completion when waiting
//   useEffect(() => {
//     if (!isWaiting) return;

//     const interval = setInterval(async () => {
//       if (loginWindow && loginWindow.closed) {
//         const isAuthed = await checkAuthCompletion();
//         if (!isAuthed) {
//           setIsWaiting(false);
//           setLoginWindow(null);
//         }
//         clearInterval(interval);
//         return;
//       }

//       const isAuthed = await checkAuthCompletion();
//       if (isAuthed) {
//         loginWindow?.close();
//         clearInterval(interval);
//       }
//     }, 2000);

//     return () => clearInterval(interval);
//   }, [isWaiting, loginWindow, checkAuthCompletion]);

//   const handleAzureSignIn = () => {
//     setIsWaiting(true);
//     const newWindow = window.open(LOGIN_URL, "_blank", "noopener");
//     setLoginWindow(newWindow);
//   };

//   return (
//     <div className="h-screen flex overflow-hidden">
//       {/* Left side - Branding */}
//       <div
//         className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
//         style={{ background: "linear-gradient(160deg, hsl(210 100% 42%) 0%, hsl(220 60% 28%) 100%)" }}
//       >
//         <div
//           className="absolute inset-0 opacity-[0.04]"
//           style={{
//             backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h1v40H0V0zm39 0h1v40h-1V0zM0 0h40v1H0V0zm0 39h40v1H0v-1z'/%3E%3C/g%3E%3C/svg%3E")`,
//           }}
//         />

//         <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
//           <Link to="/" className="flex items-center gap-3 mb-12 hover:opacity-90 transition-opacity">
//             <img src="/frame-logo-white.png" alt="FRAMe" className="h-8 w-auto" />
//           </Link>

//           <div className="mb-12">
//             <h1 className="text-3xl xl:text-4xl font-bold mb-4 leading-tight tracking-tight">
//               Sign in to manage
//               <br />
//               your BI migrations
//             </h1>
//             <p className="text-base text-white/70 leading-relaxed max-w-md">
//               Access your migration dashboard to monitor, manage, and deploy reports to Microsoft Power BI.
//             </p>
//           </div>

//           <div className="space-y-4">
//             <div className="flex items-center gap-4">
//               <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
//                 <Zap className="w-4 h-4 text-white/90" />
//               </div>
//               <div>
//                 <p className="font-medium text-sm text-white/95">Automated Migration Pipelines</p>
//                 <p className="text-xs text-white/60">Zero-downtime transfer with validation</p>
//               </div>
//             </div>

//             <div className="flex items-center gap-4">
//               <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
//                 <Shield className="w-4 h-4 text-white/90" />
//               </div>
//               <div>
//                 <p className="font-medium text-sm text-white/95">Enterprise Security</p>
//                 <p className="text-xs text-white/60">SOC 2 compliant with audit logging</p>
//               </div>
//             </div>

//             <div className="flex items-center gap-4">
//               <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
//                 <Clock className="w-4 h-4 text-white/90" />
//               </div>
//               <div>
//                 <p className="font-medium text-sm text-white/95">Migration in Minutes</p>
//                 <p className="text-xs text-white/60">Not weeks or months</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Right side - Login/Register */}
//       <div className="flex-1 lg:w-1/2 flex flex-col bg-background overflow-hidden">
//         {/* Back to home link */}
//         <div className="p-4 flex-shrink-0">
//           <Link
//             to="/"
//             className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             Back to home
//           </Link>
//         </div>

//         <div className="flex-1 flex items-center justify-center p-6">
//           <div className="w-full max-w-sm">
//             {/* Mobile logo */}
//             <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
//               <img src="/frame-logo-color.png" alt="FRAMe" className="h-7 w-auto" />
//             </div>

//             {/* Card Container */}
//             <div className="bg-card rounded-xl border border-border enterprise-shadow-lg p-6">
//               <div className="text-center mb-5">
//                 <h2 className="text-xl font-semibold text-foreground mb-1">Welcome</h2>
//                 <p className="text-sm text-muted-foreground">
//                   Sign in to continue to FRAMe
//                 </p>
//               </div>

//               {/* Azure AD waiting state */}
//               {isWaiting ? (
//                 <div className="text-center space-y-4 py-4">
//                   <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
//                     <Loader2 className="w-8 h-8 text-primary animate-spin" />
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium">Waiting for authentication...</p>
//                     <p className="text-xs text-muted-foreground mt-1">Complete sign-in in the opened browser tab</p>
//                   </div>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => {
//                       setIsWaiting(false);
//                       setLoginWindow(null);
//                     }}
//                   >
//                     Cancel
//                   </Button>
//                 </div>
//               ) : (
//                 <>
//                   {/* Azure AD SSO Button */}
//                   <Button variant="azure" className="w-full h-11" onClick={handleAzureSignIn}>
//                     <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21" fill="none">
//                       <path d="M10 0v10h10V0H10zm0 11v10h10V11H10zM0 0v10h9V0H0zm0 11v10h9V11H0z" fill="currentColor" />
//                     </svg>
//                     Sign in with Microsoft
//                     <ExternalLink className="w-4 h-4 ml-2" />
//                   </Button>
//                 </>
//               )}
//             </div>

//             <p className="mt-4 text-center text-xs text-muted-foreground">
//               By signing in, you agree to our Terms of Service and Privacy Policy.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;

import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Clock, ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BACKEND_BASE_URL = "https://accesstokens-aecjbzaqaqcuh6bd.eastus-01.azurewebsites.net";
const LOGIN_URL = `${BACKEND_BASE_URL}/login`;

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, checkAuth } = useAuth();
  const [isWaiting, setIsWaiting] = useState(false);
  const [loginWindow, setLoginWindow] = useState<Window | null>(null);

  // 🔧 FIX: once we've successfully completed auth once and navigated away,
  // this flag makes checkAuthCompletion a permanent no-op. Without it, a
  // storage-event trigger and a poll-interval tick that both fire around
  // the same time (or a stray interval left over from a churned effect)
  // could each independently call navigate('/dashboard') again later,
  // including from a tab/instance the user thinks they've left behind.
  const hasCompletedRef = useRef(false);

  // ✅ ADDED LOGGING - confirms whether Login is actually mounted/unmounted
  // when you expect it to be, and whether any interval outlives it.
  useEffect(() => {
    console.log("🟠 Login.tsx MOUNTED", { timestamp: new Date().toISOString() });
    return () => {
      console.warn("🟠 Login.tsx UNMOUNTING", { timestamp: new Date().toISOString() });
    };
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    // ✅ ADDED LOGGING - if this fires while the user thinks they're on
    // Explorer, it means AppLayout bounced them to /login and Login
    // immediately bounced them onward to /dashboard.
    console.log("🟠 Login.tsx: isAuthenticated redirect-check effect fired:", {
      isAuthenticated,
      referrerPath: document.referrer,
    });
    if (isAuthenticated) {
      console.warn("🟠 Login.tsx: isAuthenticated=true on Login mount - bouncing to /dashboard");
      console.trace("🟠 Login bounce-to-dashboard stack");
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Check if auth completed via backend or localStorage (cross-tab)
  const checkAuthCompletion = useCallback(async () => {
    // 🔧 FIX: if we've already completed and navigated once, do nothing.
    if (hasCompletedRef.current) {
      // ✅ ADDED LOGGING
      console.log("🟠 checkAuthCompletion(): already completed, skipping (no-op)", {
        timestamp: new Date().toISOString(),
      });
      return true;
    }

    // ✅ ADDED LOGGING
    console.log("🟠 checkAuthCompletion() called", {
      timestamp: new Date().toISOString(),
      localStorage_powerbi_authenticated: localStorage.getItem("powerbi_authenticated"),
    });

    // First check localStorage (set by PowerBIAuthSuccess in the popup)
    const localAuth = localStorage.getItem("powerbi_authenticated");
    if (localAuth === "true") {
      const userDetails = localStorage.getItem("user_details");
      if (userDetails) {
        const { name, email, oid, tenant } = JSON.parse(userDetails);
        sessionStorage.setItem("powerbi_authenticated", "true");
        const cleanName = (name || "User").replace(/\s*\(.*?\)\s*$/, "").trim();
        sessionStorage.setItem("azure_user_name", cleanName);
        sessionStorage.setItem("azure_user_email", email || "");
        sessionStorage.setItem("azure_user_oid", oid || "");
        sessionStorage.setItem("azure_user_tenant", tenant || "");
      }
      // Clean up localStorage flags
      localStorage.removeItem("powerbi_authenticated");
      localStorage.removeItem("user_details");
      await checkAuth();

      // 🔧 FIX: mark completed and stop the waiting state BEFORE navigating,
      // so the polling effect's cleanup runs and no new interval can spawn.
      hasCompletedRef.current = true;
      setIsWaiting(false);

      // ✅ ADDED LOGGING
      console.warn("🟠 checkAuthCompletion(): localStorage branch - navigating to /dashboard", {
        timestamp: new Date().toISOString(),
      });
      console.trace("🟠 checkAuthCompletion localStorage-branch navigate stack");
      navigate("/dashboard", { replace: true });
      return true;
    }

    // Fallback: try backend session check
    const isAuthed = await checkAuth();
    if (isAuthed) {
      // 🔧 FIX: same guard as above for the fallback branch.
      hasCompletedRef.current = true;
      setIsWaiting(false);

      // ✅ ADDED LOGGING
      console.warn("🟠 checkAuthCompletion(): backend session branch - navigating to /dashboard", {
        timestamp: new Date().toISOString(),
      });
      console.trace("🟠 checkAuthCompletion backend-branch navigate stack");
      navigate("/dashboard", { replace: true });
      return true;
    }
    return false;
  }, [checkAuth, navigate]);

  // Listen for storage events from the popup tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "powerbi_authenticated" && e.newValue === "true") {
        checkAuthCompletion();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [checkAuthCompletion]);

  // Poll for authentication completion when waiting
  useEffect(() => {
    if (!isWaiting) {
      // ✅ ADDED LOGGING
      console.log("🟠 poll effect: isWaiting=false, no interval created");
      return;
    }

    // ✅ ADDED LOGGING - a unique id per interval instance so we can tell
    // multiple overlapping intervals apart in the console.
    const intervalTag = Math.random().toString(36).slice(2, 8);
    console.warn(`🟠 poll effect: CREATING interval [${intervalTag}]`, {
      timestamp: new Date().toISOString(),
      hasLoginWindow: !!loginWindow,
    });
    console.trace(`🟠 interval [${intervalTag}] creation stack`);

    const interval = setInterval(async () => {
      // ✅ ADDED LOGGING
      console.log(`🟠 interval [${intervalTag}] TICK`, {
        timestamp: new Date().toISOString(),
        loginWindowClosed: loginWindow?.closed,
      });

      if (loginWindow && loginWindow.closed) {
        const isAuthed = await checkAuthCompletion();
        if (!isAuthed) {
          setIsWaiting(false);
          setLoginWindow(null);
        }
        console.warn(`🟠 interval [${intervalTag}] clearing (loginWindow closed branch)`);
        clearInterval(interval);
        return;
      }

      const isAuthed = await checkAuthCompletion();
      if (isAuthed) {
        loginWindow?.close();
        console.warn(`🟠 interval [${intervalTag}] clearing (auth succeeded)`);
        clearInterval(interval);
      }
    }, 2000);

    return () => {
      // ✅ ADDED LOGGING
      console.warn(`🟠 poll effect CLEANUP: clearing interval [${intervalTag}]`, {
        timestamp: new Date().toISOString(),
      });
      clearInterval(interval);
    };
  }, [isWaiting, loginWindow, checkAuthCompletion]);

  const handleAzureSignIn = () => {
    // ✅ ADDED LOGGING
    console.warn("🟠 handleAzureSignIn() CLICKED", { timestamp: new Date().toISOString() });
    setIsWaiting(true);
    const newWindow = window.open(LOGIN_URL, "_blank", "noopener");
    // ✅ ADDED LOGGING - with `noopener`, most browsers return null here,
    // which means the interval's "loginWindow.closed" branch can never
    // fire and the poll can only ever stop via a successful auth check.
    console.log("🟠 window.open() returned:", { isNull: newWindow === null, newWindow });
    setLoginWindow(newWindow);
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left side - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, hsl(210 100% 42%) 0%, hsl(220 60% 28%) 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h1v40H0V0zm39 0h1v40h-1V0zM0 0h40v1H0V0zm0 39h40v1H0v-1z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <Link to="/" className="flex items-center gap-3 mb-12 hover:opacity-90 transition-opacity">
            <img src="/frame-logo-white.png" alt="FRAMe" className="h-8 w-auto" />
          </Link>

          <div className="mb-12">
            <h1 className="text-3xl xl:text-4xl font-bold mb-4 leading-tight tracking-tight">
              Sign in to manage
              <br />
              your BI migrations
            </h1>
            <p className="text-base text-white/70 leading-relaxed max-w-md">
              Access your migration dashboard to monitor, manage, and deploy reports to Microsoft Power BI.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white/90" />
              </div>
              <div>
                <p className="font-medium text-sm text-white/95">Automated Migration Pipelines</p>
                <p className="text-xs text-white/60">Zero-downtime transfer with validation</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-white/90" />
              </div>
              <div>
                <p className="font-medium text-sm text-white/95">Enterprise Security</p>
                <p className="text-xs text-white/60">SOC 2 compliant with audit logging</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-white/90" />
              </div>
              <div>
                <p className="font-medium text-sm text-white/95">Migration in Minutes</p>
                <p className="text-xs text-white/60">Not weeks or months</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login/Register */}
      <div className="flex-1 lg:w-1/2 flex flex-col bg-background overflow-hidden">
        {/* Back to home link */}
        <div className="p-4 flex-shrink-0">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <img src="/frame-logo-color.png" alt="FRAMe" className="h-7 w-auto" />
            </div>

            {/* Card Container */}
            <div className="bg-card rounded-xl border border-border enterprise-shadow-lg p-6">
              <div className="text-center mb-5">
                <h2 className="text-xl font-semibold text-foreground mb-1">Welcome</h2>
                <p className="text-sm text-muted-foreground">
                  Sign in to continue to FRAMe
                </p>
              </div>

              {/* Azure AD waiting state */}
              {isWaiting ? (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Waiting for authentication...</p>
                    <p className="text-xs text-muted-foreground mt-1">Complete sign-in in the opened browser tab</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsWaiting(false);
                      setLoginWindow(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  {/* Azure AD SSO Button */}
                  <Button variant="azure" className="w-full h-11" onClick={handleAzureSignIn}>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21" fill="none">
                      <path d="M10 0v10h10V0H10zm0 11v10h10V11H10zM0 0v10h9V0H0zm0 11v10h9V11H0z" fill="currentColor" />
                    </svg>
                    Sign in with Microsoft
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
