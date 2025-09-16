import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { UserPlus, Sparkles } from 'lucide-react';

interface NicknameSetupProps {
  onComplete: (nickname: string) => void;
  loading?: boolean;
  error?: string;
}

export function NicknameSetup({ onComplete, loading = false, error }: NicknameSetupProps) {
  const [nickname, setNickname] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleNicknameChange = (value: string) => {
    // Allow letters, numbers, spaces, and common symbols
    const sanitized = value.replace(/[^a-zA-Z0-9\s\-_.]/g, '').substring(0, 20);
    setNickname(sanitized);
    setIsValid(sanitized.trim().length >= 2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !loading) {
      onComplete(nickname.trim());
    }
  };

  const suggestions = [
    'DebateMaster', 'BridgeBuilder', 'CruxHunter', 'VoiceOfReason', 
    'SpicyTaker', 'Synthesizer', 'TruthSeeker', 'Diplomat'
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
              <UserPlus className="w-8 h-8 text-white" />
            </motion.div>
            
            <h1 className="text-2xl font-bold">Welcome to HEARD!</h1>
            <p className="text-muted-foreground">
              Choose a nickname to start arguing (and secretly saving democracy)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Your Debate Nickname</Label>
              <Input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                placeholder="Enter a nickname..."
                className={isValid ? 'border-green-300' : ''}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                2-20 characters • Letters, numbers, and basic symbols only
              </p>
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
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 mr-2"
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  Getting Ready...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Start Debating!
                </>
              )}
            </Button>
          </form>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Or try one of these:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => handleNicknameChange(suggestion)}
                  disabled={loading}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}