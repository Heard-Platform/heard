import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, HelpCircle, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { api, safelyMakeApiCall } from "../../utils/api";
import type { VoteType } from "../../types";

interface VoterIntegrityModalProps {
  roomId: string;
  roomTopic: string;
  onClose: () => void;
}

interface TimelineEntry {
  statementId: string;
  userId: string;
  voteType: VoteType;
  timestamp: number;
}

interface IntegrityData {
  totalVoters: number;
  uniqueDevices: number;
  votersWithoutDeviceInfo: number;
  timeline: TimelineEntry[];
  statementTexts: Record<string, string>;
}

const VOTE_COLORS: Record<VoteType, string> = {
  agree: "bg-green-500",
  super_agree: "bg-emerald-700",
  disagree: "bg-red-500",
  pass: "bg-gray-400",
};

const VOTE_LABELS: Record<VoteType, string> = {
  agree: "Agree",
  super_agree: "Super agree",
  disagree: "Disagree",
  pass: "Pass",
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

type Severity = "ok" | "caution" | "warning" | "unreliable";

const UNRELIABLE_THRESHOLD = 0.3;

function severityFor({ totalVoters, uniqueDevices, votersWithoutDeviceInfo }: IntegrityData): Severity {
  if (totalVoters === 0) return "ok";
  if (votersWithoutDeviceInfo / totalVoters >= UNRELIABLE_THRESHOLD) return "unreliable";
  const measurable = totalVoters - votersWithoutDeviceInfo;
  if (measurable === 0 || uniqueDevices === measurable) return "ok";
  const ratio = uniqueDevices / measurable;
  if (ratio >= 0.8) return "caution";
  return "warning";
}

export function VoterIntegrityModal({ roomId, roomTopic, onClose }: VoterIntegrityModalProps) {
  const [data, setData] = useState<IntegrityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const response = await safelyMakeApiCall(() => api.getVoterIntegrity(roomId));
      if (response?.success && response.data) {
        setData({
          totalVoters: response.data.totalVoters,
          uniqueDevices: response.data.uniqueDevices,
          votersWithoutDeviceInfo: response.data.votersWithoutDeviceInfo,
          timeline: response.data.timeline,
          statementTexts: response.data.statementTexts,
        });
      }
      setLoading(false);
    };
    load();
  }, [roomId]);

  const severity = data ? severityFor(data) : "ok";
  const measurableVoters = data ? data.totalVoters - data.votersWithoutDeviceInfo : 0;
  const duplicateCount = data ? Math.max(0, measurableVoters - data.uniqueDevices) : 0;

  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-xl w-full flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
            Voter Integrity
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{roomTopic}</DialogDescription>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32 inactive-text-soft text-sm">
            Checking voters…
          </div>
        ) : !data ? (
          <div className="text-sm text-muted-foreground">Failed to load voter data.</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border p-3 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Total voters</span>
                <span className="text-2xl font-semibold">{data.totalVoters}</span>
              </div>
              <div className="rounded-lg border p-3 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Unique devices</span>
                <span className="text-2xl font-semibold">{data.uniqueDevices}</span>
              </div>
              <div className="rounded-lg border p-3 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">No device info</span>
                <span className="text-2xl font-semibold">{data.votersWithoutDeviceInfo}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              A device is a unique combination of IP address and user agent. Voters with no device info on file are excluded from the device count.
            </p>

            {severity === "unreliable" && (
              <Alert>
                <HelpCircle className="text-muted-foreground" />
                <AlertTitle>Not enough device data</AlertTitle>
                <AlertDescription>
                  {data.votersWithoutDeviceInfo} of {data.totalVoters} voters have no device info on file, so the unique-device count isn't reliable for this room.
                </AlertDescription>
              </Alert>
            )}

            {severity === "ok" && data.totalVoters > 0 && (
              <Alert>
                <CheckCircle2 className="text-green-600" />
                <AlertTitle>Looks clean</AlertTitle>
                <AlertDescription>
                  Every voter we have device info for came from a different device.
                </AlertDescription>
              </Alert>
            )}

            {severity === "caution" && (
              <Alert>
                <AlertTriangle className="text-amber-600" />
                <AlertTitle>Some shared devices</AlertTitle>
                <AlertDescription>
                  {duplicateCount} {duplicateCount === 1 ? "voter shares" : "voters share"} a device with another voter. This can be normal (e.g. a shared household network) but worth a glance.
                </AlertDescription>
              </Alert>
            )}

            {severity === "warning" && (
              <Alert variant="destructive">
                <AlertTriangle />
                <AlertTitle>Possible duplicate voting</AlertTitle>
                <AlertDescription>
                  Only {data.uniqueDevices} unique {data.uniqueDevices === 1 ? "device" : "devices"} for {measurableVoters} identifiable voters. A single person may have voted multiple times.
                </AlertDescription>
              </Alert>
            )}

            {data.timeline.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Vote timeline</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className={`w-2.5 h-2.5 rounded-sm ${VOTE_COLORS.agree}`} />
                      Agree
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={`w-2.5 h-2.5 rounded-sm ${VOTE_COLORS.super_agree}`} />
                      Super
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={`w-2.5 h-2.5 rounded-sm ${VOTE_COLORS.disagree}`} />
                      Disagree
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={`w-2.5 h-2.5 rounded-sm ${VOTE_COLORS.pass}`} />
                      Pass
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border p-2 max-h-40 overflow-y-auto flex flex-wrap gap-0.5 content-start">
                  {data.timeline.map((v, i) => {
                    const statement = data.statementTexts[v.statementId] ?? "(unknown statement)";
                    const tooltip = `${formatTimestamp(v.timestamp)}\n${VOTE_LABELS[v.voteType]}\n${statement}`;
                    return (
                      <span
                        key={i}
                        title={tooltip}
                        className={`w-3 h-6 rounded-sm cursor-help ${VOTE_COLORS[v.voteType]}`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.timeline.length} {data.timeline.length === 1 ? "vote" : "votes"}, oldest to newest. Hover a cell to see the statement.
                </p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
