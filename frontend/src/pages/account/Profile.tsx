import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, User, Mail, Phone, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
  });
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPw, setChangingPw] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.put("/users/profile", form);
      await refreshUser();
      toast.success("Profile updated");
      setIsEditing(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPw(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Password changed");
      setShowPwForm(false);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed";
      toast.error(msg);
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-3xl text-foreground mb-8"
        >
          My Profile
        </motion.h1>

        <div className="bg-card rounded-2xl p-6 border border-border mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center text-2xl font-display text-foreground">
              {user?.firstName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-xl text-foreground">
                {user?.fullName}
              </h2>
              <p className="text-sm text-muted-foreground font-body">
                {user?.email}
              </p>
              <span className="text-xs font-body text-sage capitalize">
                {user?.role}
              </span>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-body text-foreground mb-1.5">
                  <User size={14} /> First Name
                </label>
                <input
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-body text-foreground mb-1.5">
                  <User size={14} /> Last Name
                </label>
                <input
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-body text-foreground mb-1.5">
                  <Phone size={14} /> Phone
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-body text-sm hover:opacity-90 disabled:opacity-60 transition flex items-center gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-xl border border-border font-body text-sm hover:bg-muted transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm font-body">
                <Mail size={16} className="text-muted-foreground" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-body">
                <Phone size={16} className="text-muted-foreground" />
                <span>{user?.phone || "Not set"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-body">
                <User size={16} className="text-muted-foreground" />
                <span>
                  Member since{" "}
                  {new Date(user?.createdAt || "").toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 px-5 py-2.5 rounded-xl border border-border font-body text-sm hover:bg-muted transition"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <button
            onClick={() => setShowPwForm(!showPwForm)}
            className="flex items-center gap-2 font-display text-xl text-foreground"
          >
            <Lock size={20} /> Change Password
          </button>
          {showPwForm && (
            <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
              <input
                type="password"
                placeholder="Current password"
                value={pwForm.currentPassword}
                onChange={(e) =>
                  setPwForm({ ...pwForm, currentPassword: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                required
              />
              <input
                type="password"
                placeholder="New password (min 8 characters)"
                value={pwForm.newPassword}
                onChange={(e) =>
                  setPwForm({ ...pwForm, newPassword: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                required
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={pwForm.confirmPassword}
                onChange={(e) =>
                  setPwForm({ ...pwForm, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                required
              />
              <button
                type="submit"
                disabled={changingPw}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-body text-sm hover:opacity-90 disabled:opacity-60 transition flex items-center gap-2"
              >
                {changingPw && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
                Update Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
