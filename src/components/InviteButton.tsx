import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Mail, Send, X } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";

interface InviteButtonProps {
  roomId: string;
  roomTopic: string;
  variant?: "outline" | "default" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function InviteButton({ 
  roomId, 
  roomTopic,
  variant = "outline", 
  size = "sm",
  className = ""
}: InviteButtonProps) {
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const validateEmails = (emailString: string): string[] => {
    const emailList = emailString
      .split(",")
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = emailList.filter(email => emailRegex.test(email));
    
    if (validEmails.length !== emailList.length) {
      const invalidEmails = emailList.filter(email => !emailRegex.test(email));
      throw new Error(`Invalid email addresses: ${invalidEmails.join(", ")}`);
    }
    
    return validEmails;
  };

  const handleSendInvites = async () => {
    if (!emails.trim()) {
      toast.error("Please enter at least one email address");
      return;
    }

    setSending(true);
    
    try {
      const validEmails = validateEmails(emails);
      
      const result = await api.sendInvites(
        roomId, 
        validEmails, 
        message.trim() || undefined
      );

      if (!result.success) {
        console.error("Error sending invites:", result.error);
        toast.error(result.error || "Failed to send invites. Please try again.");
        return;
      }

      toast.success(`Invites sent to ${validEmails.length} email${validEmails.length === 1 ? '' : 's'}!`);
      setEmails("");
      setMessage("");
      setOpen(false);
      
    } catch (error) {
      console.error("Invite error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to send invites. Please check your email addresses.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSendInvites();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          title="Invite people via email"
        >
          <Mail className="w-4 h-4 mr-2" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite People to Debate</DialogTitle>
          <DialogDescription>
            Send email invitations to join this debate room
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Invite people to join: <span className="font-medium">{roomTopic}</span>
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emails">Email Addresses</Label>
            <Textarea
              id="emails"
              placeholder="Enter email addresses separated by commas&#10;example: friend@email.com, colleague@work.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] resize-none"
              disabled={sending}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple emails with commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal note to your invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] resize-none"
              maxLength={200}
              disabled={sending}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>This will be included in the email</span>
              <span>{message.length}/200</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSendInvites}
              disabled={sending || !emails.trim()}
              className="flex-1"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invites
                </>
              )}
            </Button>
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              disabled={sending}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Tip: Press Ctrl/Cmd + Enter to send quickly
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}