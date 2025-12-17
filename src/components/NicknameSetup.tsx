import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import {
  UserPlus,
  Sparkles,
  LogIn,
  Eye,
  EyeOff,
} from "lucide-react";

interface NicknameSetupProps {
  onComplete: (
    nickname: string,
    email: string,
    password: string,
    isSignIn: boolean,
  ) => void;
  onForgotPassword?: () => void;
  loading?: boolean;
  error?: string;
  joiningRoom?: boolean;
}

export function NicknameSetup({
  onComplete,
  onForgotPassword,
  loading = false,
  error,
  joiningRoom = false,
}: NicknameSetupProps) {
  const [mode, setMode] = useState<"signin" | "signup">(
    "signup",
  );
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleNicknameChange = (value: string) => {
    // Allow letters, numbers, spaces, and common symbols
    const sanitized = value
      .replace(/[^a-zA-Z0-9\s\-_.]/g, "")
      .substring(0, 20);
    setNickname(sanitized);
    validateForm(sanitized, email, password);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    validateForm(nickname, value, password);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    validateForm(nickname, email, value);
  };

  const validateForm = (
    nicknameVal: string,
    emailVal: string,
    passwordVal: string,
  ) => {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      emailVal.trim(),
    );
    const passwordValid = passwordVal.length >= 6;

    if (mode === "signup") {
      const nicknameValid = nicknameVal.trim().length >= 2;
      setIsValid(nicknameValid && emailValid && passwordValid);
    } else {
      setIsValid(emailValid && passwordValid);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !loading) {
      onComplete(
        nickname.trim(),
        email.trim(),
        password,
        mode === "signin",
      );
    }
  };

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    // Revalidate when switching modes
    validateForm(nickname, email, password);
  };

  const suggestions = [
    "DebateMaster",
    "BridgeBuilder",
    "CruxHunter",
    "VoiceOfReason",
    "SpicyTaker",
    "Synthesizer",
    "TruthSeeker",
    "Diplomat",
  ];

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
              {mode === "signup" ? (
                <UserPlus className="w-8 h-8 text-white" />
              ) : (
                <LogIn className="w-8 h-8 text-white" />
              )}
            </motion.div>

            <h1 className="text-2xl font-bold">
              {joiningRoom
                ? "Join the Debate!"
                : mode === "signup"
                  ? "Welcome to HEARD!"
                  : "Welcome Back!"}
            </h1>
            {joiningRoom && (
              <p className="text-muted-foreground">
                Sign in or create an account to join this debate!
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Your Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) =>
                  handleEmailChange(e.target.value)
                }
                placeholder="Enter your email..."
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="nickname">
                  Your Debate Nickname
                </Label>
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) =>
                    handleNicknameChange(e.target.value)
                  }
                  placeholder="Enter a nickname..."
                  disabled={loading}
                  autoComplete="username"
                />
                <p className="text-xs text-muted-foreground">
                  2-20 characters • Letters, numbers, and basic
                  symbols only
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) =>
                    handlePasswordChange(e.target.value)
                  }
                  placeholder={
                    mode === "signup"
                      ? "Create a password..."
                      : "Enter your password..."
                  }
                  disabled={loading}
                  autoComplete={
                    mode === "signup"
                      ? "new-password"
                      : "current-password"
                  }
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
                {mode === "signup"
                  ? "At least 6 characters"
                  : ""}
              </p>
              {mode === "signin" && onForgotPassword && (
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs text-purple-600 hover:text-purple-700 hover:underline"
                  disabled={loading}
                >
                  Forgot password?
                </button>
              )}
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
              disabled={!isValid || loading}
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-4 h-4 mr-2"
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  {mode === "signup"
                    ? "Creating Account..."
                    : "Signing In..."}
                </>
              ) : (
                <>
                  {mode === "signup" ? (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      {joiningRoom
                        ? "Create Account & Join!"
                        : "Create Account"}
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      {joiningRoom
                        ? "Sign In & Join!"
                        : "Sign In"}
                    </>
                  )}
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              disabled={loading}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              {mode === "signup"
                ? "Already have an account? Sign in"
                : "Need an account? Sign up"}
            </button>
          </div>

          {mode === "signup" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Or try one of these nicknames:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleNicknameChange(suggestion)
                    }
                    disabled={loading}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}