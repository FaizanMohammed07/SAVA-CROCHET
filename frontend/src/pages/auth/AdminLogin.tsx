import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Lock,
  QrCode,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import api from "@/lib/api";
import Cookies from "js-cookie";

// Admin API slug — must match ADMIN_LOGIN_SLUG in backend .env
const ADMIN_SLUG = "sava-ctrl-x7k9m2";

type Step = "credentials" | "setup-2fa" | "verify-2fa";

const AdminLogin = () => {
  const [step, setStep] = useState<Step>("credentials");
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // 2FA setup state
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupSaved, setBackupSaved] = useState(false);
  const [setupCode, setSetupCode] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [serverTime, setServerTime] = useState("");

  const { refreshUser, updateUser } = useAuth();
  const navigate = useNavigate();

  // Step 1: Submit credentials
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    setVerifyError("");

    try {
      const { data } = await api.post(`/auth/${ADMIN_SLUG}/login`, {
        email: email.trim(),
        password,
      });
      const res = data.data || data;

      // Direct login (2FA bypassed for testing)
      if (res.accessToken) {
        // 12 hours = 0.5 days
        Cookies.set("accessToken", res.accessToken, { expires: 0.5 });
        if (res.refreshToken)
          Cookies.set("refreshToken", res.refreshToken, { expires: 7 });
        await refreshUser();
        if (res.user) updateUser(res.user);
        toast.success("Admin login successful");
        navigate("/admin");
        return;
      }

      if (res.requires2FA) {
        setTempToken(res.tempToken);
        if (res.twoFactorEnabled) {
          setStep("verify-2fa");
          toast.info("Enter your authenticator code");
        } else {
          // Need to set up 2FA first
          await fetch2FASetup(res.tempToken);
        }
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Access denied";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch QR code for first-time 2FA setup
  const [setupFetched, setSetupFetched] = useState(false);
  const fetch2FASetup = async (token: string) => {
    // Prevent duplicate calls (React StrictMode / double-render)
    if (setupFetched || qrCode) return;
    setSetupFetched(true);
    try {
      const { data } = await api.post(`/auth/${ADMIN_SLUG}/setup-2fa`, {
        tempToken: token,
      });
      const res = data.data || data;
      setQrCode(res.qrCode);
      setSecret(res.secret);
      if (res.serverTime) setServerTime(res.serverTime);
      setStep("setup-2fa");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      const msg =
        axiosErr?.response?.data?.message || "Failed to start 2FA setup";
      toast.error(msg);
      setSetupFetched(false); // Allow retry on error
      // If session expired, go back to credentials step
      if (axiosErr?.response?.status === 401) {
        setStep("credentials");
        setTempToken("");
      }
    }
  };

  // Confirm 2FA setup with first code
  const handleConfirmSetup = async () => {
    const code = setupCode.trim();
    if (!code || code.length !== 6) {
      toast.error("Enter a 6-digit code from your authenticator app");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      toast.error("Code must be exactly 6 digits");
      return;
    }
    setIsLoading(true);
    setVerifyError("");
    try {
      const { data } = await api.post(`/auth/${ADMIN_SLUG}/confirm-setup-2fa`, {
        tempToken,
        token: code,
      });
      const res = data.data || data;

      if (res.backupCodes) {
        setBackupCodes(res.backupCodes);
      }

      // Set auth tokens
      Cookies.set("accessToken", res.accessToken, { expires: 1 });
      if (res.refreshToken)
        Cookies.set("refreshToken", res.refreshToken, { expires: 7 });

      // Set user directly from response — no extra /auth/me call needed
      if (res.user) updateUser(res.user);

      setVerifyError("");
      toast.success("2FA enabled! Save your backup codes, then proceed.");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      const msg = axiosErr?.response?.data?.message || "Invalid code";
      const status = axiosErr?.response?.status;
      setVerifyError(msg);
      toast.error(msg);
      // Clear the code field so user can retry easily
      setSetupCode("");
      // If session expired or locked, go back to credentials
      if (status === 401 && msg.toLowerCase().includes("session expired")) {
        setStep("credentials");
        setTempToken("");
        setSetupCode("");
        setQrCode("");
        setSecret("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Verify 2FA code (existing 2FA)
  const handleVerify2FA = async () => {
    const code = totpCode.trim();
    if (!code) {
      toast.error(useBackup ? "Enter a backup code" : "Enter your 2FA code");
      return;
    }
    if (!useBackup && !/^\d{6}$/.test(code)) {
      toast.error("Code must be exactly 6 digits");
      return;
    }
    setIsLoading(true);
    setVerifyError("");
    try {
      const { data } = await api.post(`/auth/${ADMIN_SLUG}/verify-2fa`, {
        tempToken,
        ...(useBackup ? { backupCode: code } : { token: code }),
      });
      const res = data.data || data;

      Cookies.set("accessToken", res.accessToken, { expires: 1 });
      if (res.refreshToken)
        Cookies.set("refreshToken", res.refreshToken, { expires: 7 });

      // Set user directly from response — avoids extra API call + interceptor issues
      if (res.user) updateUser(res.user);

      toast.success("Welcome back, Admin!");
      navigate("/admin", { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      const msg = axiosErr?.response?.data?.message || "Verification failed";
      const status = axiosErr?.response?.status;
      setVerifyError(msg);
      toast.error(msg);
      setTotpCode(""); // Clear code so user can retry
      // If session expired, go back to credentials step
      if (status === 401 && msg.toLowerCase().includes("session expired")) {
        setStep("credentials");
        setTempToken("");
        setTotpCode("");
        setVerifyError("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Credentials ─────────────────────────── */}
        {step === "credentials" && (
          <motion.div
            key="credentials"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative w-full max-w-md"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Admin Portal
              </h1>
              <p className="text-sm text-slate-400">
                Authorized personnel only
              </p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition placeholder:text-slate-500"
                    placeholder="admin@savacrochets.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10 transition placeholder:text-slate-500"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Authenticate
                </button>
              </form>
            </div>

            <p className="text-center text-xs text-slate-500 mt-6">
              This is a restricted access point. All attempts are logged.
            </p>
          </motion.div>
        )}

        {/* ── Step 2: 2FA Setup (first time) ──────────────── */}
        {step === "setup-2fa" && (
          <motion.div
            key="setup-2fa"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative w-full max-w-lg"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
                <QrCode className="h-8 w-8 text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Set Up Two-Factor Auth
              </h1>
              <p className="text-sm text-slate-400">
                Required for admin access. Scan with Google Authenticator or
                Authy.
              </p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
              {backupCodes.length === 0 ? (
                <div className="space-y-6">
                  {/* QR Code */}
                  {qrCode && (
                    <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-xl">
                        <img
                          src={qrCode}
                          alt="2FA QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                    </div>
                  )}

                  {/* Manual secret */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2 text-center">
                      Can&apos;t scan? Enter this key manually:
                    </p>
                    <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                      <code className="flex-1 text-sm text-amber-300 font-mono text-center break-all">
                        {secret}
                      </code>
                      <button
                        onClick={() => copyToClipboard(secret)}
                        className="text-slate-400 hover:text-white shrink-0"
                      >
                        {copiedSecret ? (
                          <CheckCircle2 size={16} className="text-green-400" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Verification input */}
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">
                      Enter 6-digit code from your app
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={setupCode}
                      onChange={(e) => {
                        setSetupCode(e.target.value.replace(/\D/g, ""));
                        setVerifyError("");
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleConfirmSetup()
                      }
                      className={`w-full px-4 py-3 rounded-xl bg-slate-700/50 border ${verifyError ? "border-red-500" : "border-slate-600"} text-white font-mono text-center text-xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/50 transition`}
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                    />
                    {verifyError && (
                      <p className="text-red-400 text-xs mt-2 text-center">
                        {verifyError}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleConfirmSetup}
                    disabled={isLoading || setupCode.length !== 6}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Verify & Enable 2FA
                  </button>

                  {/* Helpful tips */}
                  <div className="bg-slate-700/30 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-slate-400 font-medium">
                      Troubleshooting tips:
                    </p>
                    <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                      <li>
                        Make sure your phone&apos;s time is set to{" "}
                        <strong className="text-slate-400">automatic</strong>
                      </li>
                      <li>
                        Wait for a{" "}
                        <strong className="text-slate-400">fresh code</strong> —
                        don&apos;t enter one that&apos;s about to expire
                      </li>
                      <li>
                        Use the code from{" "}
                        <strong className="text-slate-400">
                          SAVA CROCHETS Admin
                        </strong>{" "}
                        entry only
                      </li>
                      <li>If you scanned twice, delete the old entry first</li>
                    </ul>
                    {serverTime && (
                      <p className="text-xs text-slate-500 mt-1">
                        Server time:{" "}
                        <span className="text-slate-400 font-mono">
                          {new Date(serverTime).toLocaleTimeString()}
                        </span>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("credentials");
                      setTempToken("");
                      setSetupCode("");
                      setQrCode("");
                      setSecret("");
                      setVerifyError("");
                    }}
                    className="w-full text-center text-xs text-slate-400 hover:text-white transition"
                  >
                    Back to login
                  </button>
                </div>
              ) : (
                /* ── Backup codes display ── */
                <div className="space-y-6">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-amber-300 text-sm font-medium text-center">
                      Save these backup codes — they won&apos;t be shown again!
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, i) => (
                      <div
                        key={i}
                        className="bg-slate-700/50 rounded-lg px-3 py-2 text-center"
                      >
                        <code className="text-sm text-slate-200 font-mono">
                          {code}
                        </code>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(backupCodes.join("\n"));
                      toast.success("Backup codes copied to clipboard");
                    }}
                    className="w-full py-2 rounded-xl bg-slate-700 text-slate-200 text-sm hover:bg-slate-600 transition flex items-center justify-center gap-2"
                  >
                    <Copy size={16} /> Copy All Codes
                  </button>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={backupSaved}
                      onChange={(e) => setBackupSaved(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-500 text-primary focus:ring-primary/50"
                    />
                    <span className="text-sm text-slate-300">
                      I have saved my backup codes safely
                    </span>
                  </label>

                  <button
                    onClick={() => navigate("/admin", { replace: true })}
                    disabled={!backupSaved}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    Continue to Admin Dashboard
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Step 3: 2FA Verify (returning admin) ────────── */}
        {step === "verify-2fa" && (
          <motion.div
            key="verify-2fa"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative w-full max-w-md"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Two-Factor Verification
              </h1>
              <p className="text-sm text-slate-400">
                {useBackup
                  ? "Enter one of your backup codes"
                  : "Enter the 6-digit code from your authenticator"}
              </p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
              <div className="space-y-5">
                <div>
                  <input
                    type="text"
                    inputMode={useBackup ? "text" : "numeric"}
                    autoComplete="one-time-code"
                    value={totpCode}
                    onChange={(e) => {
                      setTotpCode(
                        useBackup
                          ? e.target.value
                          : e.target.value.replace(/\D/g, ""),
                      );
                      setVerifyError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify2FA()}
                    className={`w-full px-4 py-4 rounded-xl bg-slate-700/50 border ${verifyError ? "border-red-500" : "border-slate-600"} text-white font-mono text-center text-xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/50 transition`}
                    placeholder={useBackup ? "abcd1234" : "000000"}
                    maxLength={useBackup ? 8 : 6}
                    autoFocus
                  />
                  {verifyError && (
                    <p className="text-red-400 text-xs mt-2 text-center">
                      {verifyError}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleVerify2FA}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Verify & Enter
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
                    {useBackup ? "Use authenticator" : "Use backup code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("credentials");
                      setTempToken("");
                      setTotpCode("");
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    Back to login
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLogin;
