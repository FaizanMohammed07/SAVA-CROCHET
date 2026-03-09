import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const [showPw, setShowPw] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const { login, verify2FALogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    try {
      const result = await login(values.email, values.password);
      if (result?.requires2FA && result.tempToken) {
        setNeeds2FA(true);
        setTempToken(result.tempToken);
        toast.info("Enter your two-factor authentication code");
        return;
      }
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Login failed";
      toast.error(msg);
    }
  };

  const handle2FAVerify = async () => {
    if (!totpCode.trim()) {
      toast.error(useBackup ? "Enter a backup code" : "Enter your 2FA code");
      return;
    }
    setIsVerifying2FA(true);
    try {
      await verify2FALogin(
        tempToken,
        useBackup ? undefined : totpCode.trim(),
        useBackup ? totpCode.trim() : undefined,
      );
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Verification failed";
      toast.error(msg);
    } finally {
      setIsVerifying2FA(false);
    }
  };

  // ─── 2FA Verification Step ──────────────────────────────
  if (needs2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-3" />
            <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
              Two-Factor Auth
            </h1>
            <p className="text-muted-foreground font-body">
              {useBackup
                ? "Enter one of your backup codes"
                : "Enter the 6-digit code from your authenticator app"}
            </p>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-body text-foreground mb-1.5">
                  {useBackup ? "Backup Code" : "Authentication Code"}
                </label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handle2FAVerify()}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground font-mono text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                  placeholder={useBackup ? "abcd1234" : "000000"}
                  maxLength={useBackup ? 8 : 6}
                  autoFocus
                />
              </div>

              <button
                onClick={handle2FAVerify}
                disabled={isVerifying2FA}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-body text-sm font-medium hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                {isVerifying2FA && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Verify
              </button>

              <div className="flex justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setUseBackup(!useBackup);
                    setTotpCode("");
                  }}
                  className="text-primary hover:underline"
                >
                  {useBackup
                    ? "Use authenticator app"
                    : "Use a backup code instead"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNeeds2FA(false);
                    setTempToken("");
                    setTotpCode("");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Back to login
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Normal Login Step ──────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground font-body">
            Sign in to your Sava Crochets account
          </p>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-body text-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                {...register("email")}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-body text-foreground">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  {...register("password")}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-body text-sm font-medium hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6 font-body">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-primary font-medium hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
