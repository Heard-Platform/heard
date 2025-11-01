import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { KeyRound, Mail, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";

interface PasswordResetProps {
  onBack: () => void;
  initialToken?: string;
}

export function PasswordReset({ onBack, initialToken }: PasswordResetProps) {
  const [mode, setMode] = useState<"request" | "reset">(initialToken ? "reset" : "request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(initialToken || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { api } = await import("../utils/api");
      const response = await api.forgotPassword(email);

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error || "Failed to send reset email");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { api } = await import("../utils/api");
      const response = await api.resetPassword(token, newPassword);

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error || "Failed to reset password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success && mode === "request") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center"
              >
                <CheckCircle className="w-8 h-8 text-green-600" />
              </motion.div>

              <h1 className="text-2xl font-bold">Check Your Email</h1>
              <p className="text-muted-foreground">
                If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
              </p>
              <p className="text-sm text-muted-foreground">
                The link will expire in 1 hour.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={onBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>

              <button
                type="button"
                onClick={() => {
                  setMode("reset");
                  setSuccess(false);
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground underline"
              >
                Already have a reset code?
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (success && mode === "reset") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center"
              >
                <CheckCircle className="w-8 h-8 text-green-600" />
              </motion.div>

              <h1 className="text-2xl font-bold">Password Reset Successful!</h1>
              <p className="text-muted-foreground">
                Your password has been reset. You can now sign in with your new password.
              </p>
            </div>

            <Button
              className="w-full"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (mode === "request") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 space-y-6">
            <div className="text-center space-y-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center"
              >
                <Mail className="w-8 h-8 text-white" />
              </motion.div>

              <h1 className="text-2xl font-bold">Forgot Password?</h1>
              <p className="text-muted-foreground">
                No worries! Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email..."
                  disabled={loading}
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !email}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="space-y-3">
              <button
                type="button"
                onClick={onBack}
                className="w-full text-sm text-muted-foreground hover:text-foreground underline"
                disabled={loading}
              >
                <ArrowLeft className="w-3 h-3 inline mr-1" />
                Back to Sign In
              </button>

              <button
                type="button"
                onClick={() => setMode("reset")}
                className="w-full text-sm text-muted-foreground hover:text-foreground underline"
                disabled={loading}
              >
                Already have a reset code?
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Reset mode
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 space-y-6">
          <div className="text-center space-y-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center"
            >
              <KeyRound className="w-8 h-8 text-white" />
            </motion.div>

            <h1 className="text-2xl font-bold">Reset Your Password</h1>
            <p className="text-muted-foreground">
              Enter your reset code and new password below.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Reset Code</Label>
              <Input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter reset code from email..."
                disabled={loading}
                required
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password..."
                  disabled={loading}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                At least 6 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password..."
                disabled={loading}
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !token || !newPassword || !confirmPassword}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </Button>
          </form>

          <div className="space-y-3">
            <button
              type="button"
              onClick={onBack}
              className="w-full text-sm text-muted-foreground hover:text-foreground underline"
              disabled={loading}
            >
              <ArrowLeft className="w-3 h-3 inline mr-1" />
              Back to Sign In
            </button>

            <button
              type="button"
              onClick={() => setMode("request")}
              className="w-full text-sm text-muted-foreground hover:text-foreground underline"
              disabled={loading}
            >
              Need a reset code?
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
