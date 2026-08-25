import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, User, Building2, Fingerprint } from "lucide-react";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const { user } = useAuth();

  const tenant = sessionStorage.getItem("azure_user_tenant") || "—";
  const oid = sessionStorage.getItem("azure_user_oid") || "—";

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const details = [
    { icon: User, label: "Name", value: user?.name || "—" },
    { icon: Mail, label: "Email", value: user?.email || "—" },
    { icon: Fingerprint, label: "Object ID", value: oid },
    { icon: Building2, label: "Tenant ID", value: tenant },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {user ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="w-full space-y-3">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium break-all">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
