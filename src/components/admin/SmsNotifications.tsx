import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { MessageSquare, Send } from "lucide-react";
import { adminApi } from "../../utils/admin-api";
import type { DebateRoom } from "../../types";

interface SmsNotificationsProps {
  adminKey: string;
  currentUserId: string;
  debates: DebateRoom[];
}

export function SmsNotifications({ adminKey, currentUserId, debates }: SmsNotificationsProps) {
  const [sending, setSending] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  const handleSendCelebrationSms = async () => {
    if (!currentUserId) {
      alert("No user ID available");
      return;
    }

    if (!selectedRoomId) {
      alert("Please select a debate room");
      return;
    }

    setSending(true);
    try {
      const res = await adminApi.sendTestCelebrationSms(adminKey, currentUserId, selectedRoomId);

      if (res.success) {
        alert("🎉 Celebration SMS sent successfully!");
      } else {
        alert(`Failed to send SMS: ${res.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error sending test celebration SMS:", error);
      alert("Failed to send SMS");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl">SMS Notification Testing</h2>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">
            🎉 Test Celebration SMS
          </h3>
          <p className="text-sm text-purple-800 mb-4">
            Send a test celebration SMS to the current user using data from a real debate room.
          </p>
          
          <div className="mb-4">
            <Label htmlFor="roomSelect">Select Debate Room</Label>
            <Select
              value={selectedRoomId}
              onValueChange={setSelectedRoomId}
            >
              <SelectTrigger id="roomSelect">
                <SelectValue placeholder="Choose a debate..." />
              </SelectTrigger>
              <SelectContent>
                {debates.length === 0 && (
                  <SelectItem value="none" disabled>No debates available</SelectItem>
                )}
                {debates.map((debate) => (
                  <SelectItem key={debate.id} value={debate.id}>
                    {debate.topic.substring(0, 60)}{debate.topic.length > 60 ? "..." : ""} ({debate.participants.length} participants)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSendCelebrationSms}
            disabled={sending || !currentUserId || !selectedRoomId}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {sending ? (
              <>Sending SMS...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Test Celebration SMS
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}