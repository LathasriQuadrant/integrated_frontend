import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { buildTableauTree } from "@/data/tableauTreeMapper";

// Integrated backend (existing Tableau routes + new Pre-Migration AI
// Analysis routes) now runs as a single local app. Override with
// VITE_TABLEAU_BACKEND_URL for a non-local deployment.
const TABLEAU_BACKEND_URL = import.meta.env.VITE_TABLEAU_BACKEND_URL || "https://frame-premigration-test-cabfgrazgacqgzf9.eastus-01.azurewebsites.net";

interface TableauAuthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

const TableauAuthModal = ({ isOpen, onSuccess, onCancel }: TableauAuthModalProps) => {
  const [authState, setAuthState] = useState<"idle" | "authenticating" | "success">("idle");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setAuthState("idle");
      setUsername("");
      setPassword("");
      setError("");
    }
  }, [isOpen]);

  const handleSignIn = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setError("");
    setAuthState("authenticating");

    try {
      /* ===============================
         1️⃣ SIGN IN TO TABLEAU
      =============================== */
      const signinResponse = await fetch(
        `${TABLEAU_BACKEND_URL}/tableau/signin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim(),
            site_content_url: "",
          }),
        },
      );

      if (!signinResponse.ok) {
        throw new Error("Authentication failed");
      }

      const signinData = await signinResponse.json();

      if (!signinData.api_token) {
        throw new Error("API token not returned from server");
      }

      sessionStorage.setItem("tableau_api_token", signinData.api_token);
      // Set auth flags IMMEDIATELY so AppLayout won't redirect during the slow fetch
      sessionStorage.setItem("local_authenticated", "true");
      sessionStorage.setItem("powerbi_authenticated", "true");

      /* ===============================
         2️⃣ FETCH ALL TABLEAU DATA
      =============================== */
      const fetchResponse = await fetch(
        `${TABLEAU_BACKEND_URL}/tableau/fetch_data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_token: signinData.api_token,
          }),
        },
      );
      console.log("****************************");

      console.log(fetchResponse);
      if (!fetchResponse.ok) {
        throw new Error("Failed to fetch Tableau data");
      }

      const backendData = await fetchResponse.json();
      console.log(backendData);
      /* ===============================
         3️⃣ BUILD FILE EXPLORER TREE
      =============================== */
      const tableauTree = buildTableauTree(backendData);

      sessionStorage.setItem("tableau_tree", JSON.stringify(tableauTree));

      setAuthState("success");

      toast({
        title: "Signed in successfully",
        description: "Tableau projects loaded",
      });

      setTimeout(() => {
        onSuccess();
      }, 700);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";

      setAuthState("idle");
      setError(message);

      toast({
        title: "Sign in failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" style={{ color: "#E97627" }} />
            Tableau Sign In
          </DialogTitle>
          <DialogDescription>Enter your Tableau Server or Tableau Online credentials</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {authState === "idle" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {/* <Button onClick={handleSignIn} className="text-center" style={{ backgroundColor: "#E97627" }}>
                Sign In
              </Button> */}
              <div className="flex justify-center">
                <Button onClick={handleSignIn} style={{ backgroundColor: "#E97627" }}>
                  Sign In
                </Button>
              </div>
            </div>
          )}

          {authState === "authenticating" && (
            <div className="text-center space-y-4 py-6">
              <Loader2 className="w-12 h-12 mx-auto animate-spin" style={{ color: "#E97627" }} />
              <p className="text-sm text-muted-foreground">Connecting to Tableau Server…</p>
            </div>
          )}

          {authState === "success" && (
            <div className="text-center space-y-4 py-6">
              <CheckCircle2 className="w-10 h-10 mx-auto text-success" />
              <p className="text-sm font-medium">Successfully connected</p>
              <p className="text-sm text-muted-foreground">Loading Tableau content…</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TableauAuthModal;
