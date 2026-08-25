import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * This page handles the callback from Azure AD authentication.
 * Extracts user profile from query params and redirects to dashboard.
 */
const PowerBIAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAuth } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAndRedirect = async () => {
      // Extract user profile from query parameters
      const rawName = searchParams.get("name") || "User";
      const name = rawName.replace(/\s*\(.*?\)\s*$/, "").trim();
      const email = searchParams.get("email") || "";
      const oid = searchParams.get("oid") || "";
      const tenant = searchParams.get("tenant") || "";
      const accessToken = searchParams.get("access_token") || "";
      const refreshToken = searchParams.get("refresh_token") || "";

      // Save user details to sessionStorage and localStorage
      sessionStorage.setItem("powerbi_authenticated", "true");
      sessionStorage.setItem("azure_user_name", name);
      sessionStorage.setItem("azure_user_email", email);
      sessionStorage.setItem("azure_user_oid", oid);
      sessionStorage.setItem("azure_user_tenant", tenant);
      sessionStorage.setItem("access_token", accessToken);
      sessionStorage.setItem("refresh_token", refreshToken);

      // Also save to localStorage to notify other tabs (Login polling)
      localStorage.setItem("powerbi_authenticated", "true");
      localStorage.setItem("user_details", JSON.stringify({ name, email, oid, tenant }));

      // Try to verify with backend, but don't block on failure
      await checkAuth();
      
      setIsVerifying(false);
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
    };
    
    verifyAndRedirect();
  }, [checkAuth, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8 max-w-md">
        <div className="w-16 h-16 rounded-full bg-success/10 mx-auto flex items-center justify-center">
          {isVerifying ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <CheckCircle2 className="w-8 h-8 text-success" />
          )}
        </div>
        <h2 className="text-xl font-semibold">
          {isVerifying ? "Verifying..." : "Authentication Successful"}
        </h2>
        <p className="text-muted-foreground">
          {isVerifying 
            ? "Please wait while we verify your credentials..."
            : "Redirecting to dashboard..."}
        </p>
      </div>
    </div>
  );
};

export default PowerBIAuthSuccess;