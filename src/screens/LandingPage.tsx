import { Sparkles, Zap, MessageCircle, Heart, Users } from "lucide-react";
import { NicknameSetup } from "../components/NicknameSetup";
import { DevDebateListPanel } from "../components/onboarding/DevDebateListPanel";
import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "../components/ui/button";

interface LandingPageProps {
  loading: boolean;
  error: string;
  joiningRoom: boolean;
  onComplete: (
    nickname: string,
    email: string,
    password: string,
    isSignIn: boolean,
  ) => void;
  onForgotPassword: () => void;
}

const animatedIcons = [
  { Icon: MessageCircle, color: "text-yellow-200", delay: 0 },
  { Icon: Zap, color: "text-pink-200", delay: 0.3 },
  { Icon: Heart, color: "text-red-200", delay: 0.6 },
  { Icon: Users, color: "text-blue-200", delay: 0.9 },
];

export function LandingPage({
  loading,
  error,
  joiningRoom,
  onComplete,
  onForgotPassword,
}: LandingPageProps) {
  const [showSignup, setShowSignup] = useState(false);

  if (showSignup) {
    return (
      <NicknameSetup
        onComplete={onComplete}
        onForgotPassword={onForgotPassword}
        loading={loading}
        error={error}
        joiningRoom={joiningRoom}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 relative overflow-hidden">
      <DevDebateListPanel />
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
      
      <motion.div
        className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full opacity-20 blur-2xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-40 h-40 bg-blue-300 rounded-full opacity-20 blur-2xl"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -30, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-2xl text-center space-y-6"
        >
          <div className="space-y-4">
            <motion.div
              className="relative w-20 h-20 mx-auto"
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-300 rounded-full blur-xl opacity-60 animate-pulse" />
              <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-2xl">
                <Sparkles className="w-10 h-10 text-purple-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-black text-white drop-shadow-lg tracking-tight">
                Welcome to
              </h1>
              <motion.h1 
                className="text-5xl font-black bg-gradient-to-r from-yellow-200 via-pink-200 to-white bg-clip-text text-transparent drop-shadow-2xl mt-2"
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{ backgroundSize: "200% 200%" }}
              >
                HEARD
              </motion.h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-4 flex-wrap"
            >
              {animatedIcons.map(({ Icon, color, delay }) => (
                <motion.div
                  key={delay}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay }}
                >
                  <Icon className={`w-8 h-8 ${color}`} />
                </motion.div>
              ))}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xl text-white/95 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-md px-4"
            >
              Heard is an app for making conversations, debates, and decision making fun.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            <p className="text-white/90 text-lg">
              You can{" "}
              <a
                href="https://amasonlong.notion.site/About-Heard-2cc4ab4bf00380a9b63ce3b83234ae02?pvs=73"
                target="_blank"
                rel="noopener noreferrer"
                className="font-black text-yellow-200 hover:text-yellow-100 underline decoration-4 decoration-yellow-300/50 underline-offset-4 transition-colors"
              >
                tap here to learn more
              </a>
            </p>

            <motion.p
              className="text-2xl font-black text-white drop-shadow-lg"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              But the best way to learn about Heard is to just use it!
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="space-y-4"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => setShowSignup(true)}
                size="lg"
                className="w-full max-w-md mx-auto h-16 bg-white text-purple-600 hover:bg-yellow-200 hover:text-purple-700 shadow-2xl font-black rounded-2xl border-4 border-white/50 transition-all flex items-center justify-center gap-2 py-3 px-6"
              >
                <Sparkles className="w-7 h-7 flex-shrink-0" />
                <span className="text-lg leading-tight text-center">Create Account or Sign In</span>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}