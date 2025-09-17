import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ActiveRoomsList } from '../components/ActiveRoomsList'
import { Plus } from 'lucide-react'

interface LobbyScreenProps {
  user: any
  activeRooms: any[]
  loading: boolean
  error: string | null
  onCreateRoom: (topic: string) => Promise<void>
  onJoinRoom: (roomId: string) => Promise<void>
  onRefreshRooms: () => Promise<any[]>
  onJumpToFinalResults?: () => Promise<void>
}

const debateTopics = [
  "Social media does more harm than good for society",
  "Remote work is better than in-person work",
  "AI will solve more problems than it creates", 
  "Democracy is the best form of government",
  "Economic growth should be prioritized over environmental protection"
]

export function LobbyScreen({
  user,
  activeRooms,
  loading,
  error,
  onCreateRoom,
  onJoinRoom,
  onRefreshRooms,
  onJumpToFinalResults
}: LobbyScreenProps) {
  const [newRoomTopic, setNewRoomTopic] = useState('')

  const handleCreateRoom = async () => {
    if (!newRoomTopic.trim()) return
    await onCreateRoom(newRoomTopic.trim())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-6 max-w-2xl w-full"
      >
        <motion.h1 
          className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          HEARD
        </motion.h1>
        <p className="text-xl text-muted-foreground">
          An app for arguing (and secretly saving democracy)
        </p>

        {user && (
          <Card className="p-4 bg-green-50 border-green-200">
            <p className="text-green-800">
              Welcome back, <span className="font-medium">{user.nickname}</span>! 
              <span className="ml-2 text-sm">Score: {user.score}</span>
            </p>
          </Card>
        )}

        <Card className="p-6 text-left">
          <h3 className="mb-3">🎮 How to Play:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Submit statements on the debate topic</li>
            <li>• Vote on other players' contributions</li>
            <li>• Find <Badge variant="outline">🌉 Bridges</Badge> between different views</li>
            <li>• Identify <Badge variant="outline">⚡ Cruxes</Badge> at the heart of disagreements</li>
            <li>• Discover <Badge variant="outline">💎 Pluralities</Badge> - underrepresented perspectives</li>
            <li>• Earn points and build streaks!</li>
          </ul>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="mb-4">🏛️ Create New Debate Room</h3>
            <div className="space-y-3">
              <select 
                className="w-full p-2 border rounded-md"
                value={newRoomTopic}
                onChange={(e) => setNewRoomTopic(e.target.value)}
              >
                <option value="">Choose a topic...</option>
                {debateTopics.map((topic) => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
              <Button 
                onClick={handleCreateRoom}
                disabled={!newRoomTopic}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Room
              </Button>
            </div>
          </Card>

          <ActiveRoomsList
            rooms={activeRooms}
            onJoinRoom={onJoinRoom}
            onRefresh={onRefreshRooms}
            loading={loading}
          />
        </div>

        <div className="flex gap-3">
          {/* Development only - remove in production */}
          {onJumpToFinalResults && (
            <Button
              onClick={onJumpToFinalResults}
              variant="outline"
              size="sm"
              className="text-xs bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
            >
              🚧 DEV: Jump to Final Results
            </Button>
          )}
        </div>

        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </Card>
        )}
      </motion.div>
    </div>
  )
}