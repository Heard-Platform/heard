import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Mail } from "lucide-react";
import { adminApi } from "../../utils/admin-api";

interface FlyersProps {
  adminKey: string;
}

interface FlyerEmail {
  email: string;
}

export function Flyers({ adminKey }: FlyersProps) {
  const [flyerEmails, setFlyerEmails] = useState<FlyerEmail[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlyerEmails = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getFlyerEmails(adminKey);
      if (res.success && res.data) {
        setFlyerEmails(res.data.emails);
      }
    } catch (error) {
      console.error("Error fetching flyer emails:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlyerEmails();
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl">Flyer Email Submissions</h2>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-purple-900 mb-2">
          📧 Total Flyer Emails: {flyerEmails.length}
        </h3>
        <p className="text-sm text-purple-800">
          Emails collected from physical flyer campaigns
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading flyer emails...</p>
      ) : flyerEmails.length === 0 ? (
        <p className="text-sm text-muted-foreground">No flyer emails submitted yet.</p>
      ) : (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">
            Email Addresses ({flyerEmails.length})
          </h3>
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <div className="divide-y">
              {flyerEmails.map((item, index) => (
                <div key={index} className="p-3 hover:bg-muted/50">
                  <p className="text-sm font-mono">{item.email}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
