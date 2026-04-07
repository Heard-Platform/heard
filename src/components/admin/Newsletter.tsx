import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Mail, Send, TestTube } from "lucide-react";
import { adminApi } from "../../utils/admin-api";

interface NewsletterProps {
  adminKey: string;
}

export function Newsletter({ adminKey }: NewsletterProps) {
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [eligibleCount, setEligibleCount] = useState<number | null>(null);
  const [alreadySentCount, setAlreadySentCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNewsletter, setSelectedNewsletter] = useState<number>(11);

  const fetchEligibleCount = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getNewsletterEligibleCount(adminKey, selectedNewsletter);
      if (res.success && res.data) {
        setEligibleCount(res.data.eligible);
        setAlreadySentCount(res.data.alreadySent);
      }
    } catch (error) {
      console.error("Error fetching eligible count:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEligibleCount();
  }, [selectedNewsletter]);

  const handleSendNewsletter = async (isTest: boolean) => {
    if (isTest && !testEmail.trim()) {
      alert("Please enter a test email address");
      return;
    }

    if (!isTest && eligibleCount !== null) {
      const confirmed = confirm(
        `Send newsletter to ${eligibleCount} users?\n\n` +
          `This will send the "Ya' Heard?" newsletter\n` +
          `Are you sure?`
      );

      if (!confirmed) return;
    }

    const setter = isTest ? setSendingTest : setSending;
    setter(true);
    try {
      const res = await adminApi.sendNewsletter(
        adminKey,
        isTest,
        testEmail,
        selectedNewsletter
      );

      if (res.success && res.data) {
        alert(
          `Newsletter ${isTest ? "test " : ""}sent successfully!\n\n` +
            `✅ Sent: ${res.data.sent}\n` +
            `❌ Failed: ${res.data.failed}\n` +
            `📊 Total: ${res.data.total}`
        );
        
        if (!isTest) {
          await fetchEligibleCount();
        }
      } else {
        alert(`Failed to send newsletter: ${res.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error sending newsletter:", error);
      alert("Failed to send newsletter");
    } finally {
      setter(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl">Send Newsletter</h2>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="newsletterSelect">Newsletter Edition</Label>
          <Select
            value={selectedNewsletter.toString()}
            onValueChange={(value: string) => setSelectedNewsletter(parseInt(value))}
          >
            <SelectTrigger id="newsletterSelect">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Newsletter #1 - Cold Showers & Livestreams</SelectItem>
              <SelectItem value="2">Newsletter #2 - News Feature & Broken Strings</SelectItem>
              <SelectItem value="3">Newsletter #3 - GoFundMe, AI Rickroll & Roadmap</SelectItem>
              <SelectItem value="4">Newsletter #4 - New Features & Updates</SelectItem>
              <SelectItem value="5">Newsletter #5 - Community Features, Mom Test & Dupont</SelectItem>
              <SelectItem value="6">Newsletter #6 - Breaking 100 Users, Guerrilla Marketing</SelectItem>
              <SelectItem value="7">Newsletter #7 - Public Benefit Corp, Custom Feeds & March Outreach Blitz</SelectItem>
              {Array.from({ length: 4 }, (_, i) => i + 8).map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  Newsletter #{num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-purple-900 mb-2">
          📧 Ya' Heard? Newsletter #{selectedNewsletter}
        </h3>
        {loading ? (
          <p className="text-sm text-purple-800">Loading eligible users...</p>
        ) : (
          <>
            <p className="text-sm text-purple-800 mb-1">
              This will send a newsletter to <strong>{eligibleCount ?? 0} remaining users</strong>
            </p>
            {alreadySentCount !== null && alreadySentCount > 0 && (
              <p className="text-xs text-purple-700 mb-2">
                ✓ Already sent to {alreadySentCount} users
              </p>
            )}
            <p className="text-xs text-purple-700">
              ⚡ Sends with 1 second delay between emails.
            </p>
          </>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="testEmail">Test Email (Optional)</Label>
          <Input
            id="testEmail"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={sending || sendingTest}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Send a test email to yourself first to preview
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => handleSendNewsletter(true)}
          disabled={sendingTest || sending || !testEmail.trim()}
          variant="outline"
          className="flex-1"
        >
          {sendingTest ? (
            <>Sending Test...</>
          ) : (
            <>
              <TestTube className="w-4 h-4 mr-2" />
              Send Test Email
            </>
          )}
        </Button>

        <Button
          onClick={() => handleSendNewsletter(false)}
          disabled={sending || sendingTest}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {sending ? (
            <>Sending Newsletter...</>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send to {eligibleCount} Users
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}