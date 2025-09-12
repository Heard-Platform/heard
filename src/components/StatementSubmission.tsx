import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Lightbulb, Zap, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface StatementSubmissionProps {
  onSubmit: (statement: string, type?: 'bridge' | 'crux' | 'plurality') => void;
  currentRound: 'initial' | 'bridge' | 'crux' | 'plurality';
  isActive: boolean;
  placeholder?: string;
}

export function StatementSubmission({ onSubmit, currentRound, isActive, placeholder }: StatementSubmissionProps) {
  const [statement, setStatement] = useState('');
  const [selectedType, setSelectedType] = useState<'bridge' | 'crux' | 'plurality' | null>(null);

  const handleSubmit = () => {
    if (statement.trim()) {
      onSubmit(statement.trim(), selectedType || undefined);
      setStatement('');
      setSelectedType(null);
    }
  };

  const getRoundInfo = () => {
    switch (currentRound) {
      case 'bridge':
        return {
          title: 'Find Bridges 🌉',
          description: 'Submit ideas that could bridge different perspectives',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        };
      case 'crux':
        return {
          title: 'Identify Cruxes ⚡',
          description: 'What are the core disagreements? Get to the heart of the matter',
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      case 'plurality':
        return {
          title: 'Discover Pluralities 💎',
          description: 'Share underrepresented perspectives and minority viewpoints',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        };
      default:
        return {
          title: 'Share Your Take 💭',
          description: 'Submit your initial statement on this topic',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        };
    }
  };

  const roundInfo = getRoundInfo();

  if (!isActive) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Round ended - time to vote!</p>
      </div>
    );
  }

  return (
    <motion.div
      className={`p-6 rounded-lg border-2 ${roundInfo.bgColor} border-opacity-20`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-4">
        <h3 className={`${roundInfo.color} mb-1`}>{roundInfo.title}</h3>
        <p className="text-sm text-muted-foreground">{roundInfo.description}</p>
      </div>

      {currentRound !== 'initial' && (
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant={selectedType === 'bridge' ? 'default' : 'outline'}
            onClick={() => setSelectedType(selectedType === 'bridge' ? null : 'bridge')}
            className="flex items-center gap-1"
          >
            🌉 Bridge
          </Button>
          <Button
            size="sm"
            variant={selectedType === 'crux' ? 'default' : 'outline'}
            onClick={() => setSelectedType(selectedType === 'crux' ? null : 'crux')}
            className="flex items-center gap-1"
          >
            ⚡ Crux
          </Button>
          <Button
            size="sm"
            variant={selectedType === 'plurality' ? 'default' : 'outline'}
            onClick={() => setSelectedType(selectedType === 'plurality' ? null : 'plurality')}
            className="flex items-center gap-1"
          >
            💎 Plurality
          </Button>
        </div>
      )}

      <div className="space-y-3">
        <Textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder={placeholder || "What's your take? Spicy takes welcome! 🌶️"}
          className="min-h-[100px] resize-none"
          maxLength={280}
        />
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {statement.length}/280 characters
          </span>
          <Button
            onClick={handleSubmit}
            disabled={!statement.trim()}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit
          </Button>
        </div>
      </div>
    </motion.div>
  );
}