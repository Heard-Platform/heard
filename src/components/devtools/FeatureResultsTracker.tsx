import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import {
  X,
  TrendingUp,
  Smartphone,
  Bell,
  UserPlus,
  Tag,
  Flag,
  FileCheck,
  LucideIcon,
  Globe,
  Fingerprint,
  Monitor,
  Shield,
  Bot,
  Rabbit,
} from "lucide-react";
import { api } from "../../utils/api";
import type { FeatureResults } from "../../types";
import { AvatarAnimalChart } from "./feature-tracker/AvatarAnimalChart";

interface FeatureResultsTrackerProps {
  onExit: () => void;
}

interface FeatureCardData {
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  title: string;
  description: string;
  getValue: (stats: FeatureResults) => number;
  getDate: (stats: FeatureResults) => number;
  renderExtra?: (stats: FeatureResults) => ReactNode;
}

export function FeatureResultsTracker({ onExit }: FeatureResultsTrackerProps) {
  const [stats, setStats] = useState<FeatureResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.getFeatureStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching feature stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  };

  let featureCards: FeatureCardData[] = [
    {
      icon: Bell,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-100",
      title: "Phone Submissions",
      description: "Phone numbers submitted via the sign up card (including unverified)",
      getValue: (s) => s.phoneSubmissions,
      getDate: (s) => s.phoneSubmissionsSince,
    },
    {
      icon: Bot,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-100",
      title: "WebDriver Detected",
      description: "Users with WebDriver detected (potential bots/automation)",
      getValue: (s) => s.webDriverUsers,
      getDate: (s) => s.webDriverUsersSince,
    },
    {
      icon: Globe,
      iconColor: "text-teal-600",
      bgColor: "bg-teal-100",
      title: "Unique IP Addresses",
      description: "Distinct IP addresses from all users",
      getValue: (s) => s.uniqueIpAddresses,
      getDate: (s) => s.uniqueIpAddressesSince,
    },
    {
      icon: Fingerprint,
      iconColor: "text-pink-600",
      bgColor: "bg-pink-100",
      title: "Unique Fingerprints",
      description: "Distinct browser fingerprints captured",
      getValue: (s) => s.uniqueFingerprints,
      getDate: (s) => s.uniqueFingerprintsSince,
    },
    {
      icon: Monitor,
      iconColor: "text-cyan-600",
      bgColor: "bg-cyan-100",
      title: "Unique User Agents",
      description: "Distinct browser/device user agents",
      getValue: (s) => s.uniqueUserAgents,
      getDate: (s) => s.uniqueUserAgentsSince,
    },
    {
      icon: FileCheck,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-100",
      title: "TOS Agreements",
      description: "Users who have agreed to the Terms of Service",
      getValue: (s) => s.tosAgreedUsers,
      getDate: (s) => s.tosAgreedSince,
    },
    {
      icon: Shield,
      iconColor: "text-violet-600",
      bgColor: "bg-violet-100",
      title: "Privacy Policy Agreements",
      description: "Users who have agreed to the Privacy Policy",
      getValue: (s) => s.privacyPolicyAgreedUsers,
      getDate: (s) => s.privacyPolicyAgreedSince,
    },
    {
      icon: Tag,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-100",
      title: "Flyer Email Submissions",
      description: "Emails collected from QR code flyer voting flows",
      getValue: (s) => s.flyerEmails,
      getDate: (s) => s.flyerEmailsSince,
    },
    {
      icon: Flag,
      iconColor: "text-red-600",
      bgColor: "bg-red-100",
      title: "User Reports",
      description: "Total number of statements flagged by users",
      getValue: (s) => s.userReports,
      getDate: (s) => s.userReportsSince,
    },
    {
      icon: Smartphone,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      title: "Phone Verified Users",
      description: "Non-anonymous users who have verified their phone number",
      getValue: (s) => s.phoneVerifiedUsers,
      getDate: (s) => s.phoneVerifiedSince,
    },
    {
      icon: UserPlus,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      title: "Converted from Anonymous",
      description: "Users who started anonymous and later created an account",
      getValue: (s) => s.convertedFromAnonUsers,
      getDate: (s) => s.convertedFromAnonSince,
    },
    {
      icon: Tag,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
      title: "Users from Flyers",
      description: "Users who signed up via a QR code flyer",
      getValue: (s) => s.flyerUsers,
      getDate: (s) => s.flyerUsersSince,
    },
    {
      icon: Rabbit,
      iconColor: "text-lime-600",
      bgColor: "bg-lime-100",
      title: "Avatar Animal Chosen",
      description: "Users who have selected an avatar animal",
      getValue: (s) => s.avatarAnimalUsers,
      getDate: (s) => s.avatarAnimalUsersSince,
      renderExtra: (s) => <AvatarAnimalChart {...s.avatarAnimalData} />
    },
  ]

  featureCards.sort((a, b) =>
    stats ? b.getDate(stats) - a.getDate(stats) : 0,
  );

  if (loading) {
    return (
      <div className="heard-page-bg heard-center p-4">
        <Card className="w-full max-w-md p-8">
          <p className="text-center">Loading feature stats...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="heard-page-bg p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="heard-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl">Feature Results Tracker</h1>
          </div>
          <Button
            variant="outline"
            onClick={onExit}
          >
            <X className="w-4 h-4 mr-2" />
            Exit
          </Button>
        </div>

        <div className="space-y-4">
          {featureCards.map((card) => (
            <Card className="p-6" key={card.title}>
              <div className="flex items-center gap-4">
                <div className={`p-3 ${card.bgColor} rounded-lg`}>
                  <card.icon className={`w-8 h-8 ${card.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
                  <p className="text-3xl font-bold">{stats ? card.getValue(stats) : 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                  {stats && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Feature released on {formatDate(card.getDate(stats))}
                    </p>
                  )}
                </div>
                {stats && card.renderExtra && (
                  <div className="shrink-0">
                    {card.renderExtra(stats)}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}