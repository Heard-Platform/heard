import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Play, Loader2 } from "lucide-react";
import { useDebateSession } from "../../hooks/useDebateSession";
import { EnrichmentConfig } from "../../types";

// @ts-ignore
import { toast } from "sonner@2.0.3";

export function EnrichmentTab() {
  const {
    getEnrichmentConfig,
    setEnrichmentConfig,
    runEnrichmentNow,
  } = useDebateSession();
  const [config, setConfig] = useState<EnrichmentConfig>({
    enabled: false,
    averageIntervalMins: 5,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    const response = await getEnrichmentConfig();
    if (response?.success && response.data) {
      setConfig(response.data);
    } else {
      console.error("Error fetching config:", response?.error);
      toast.error("Failed to load configuration");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    const response = await setEnrichmentConfig(config);
    if (response?.success && response.data) {
      toast.success("Configuration saved");
      setConfig(response.data);
    } else {
      console.error("Error saving config:", response?.error);
      toast.error("Failed to save configuration");
    }
    setSaving(false);
  };

  const handleRunNow = async () => {
    setRunning(true);
    const response = await runEnrichmentNow();
    if (response?.success && response.data) {
      toast.success(`Post created! Room ID: ${response.data.roomId}`);
    } else {
      console.error("Error running enrichment:", response?.error);
      toast.error("Failed to run enrichment");
    }
    setRunning(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Enrichment Service Configuration</h2>
        <p className="text-sm text-slate-600">
          Control the enrichment service in the Test community
        </p>
      </div>

      <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium">Enabled</label>
            <p className="text-sm text-slate-600">
              Turn on/off enrichment service
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) =>
                setConfig({ ...config, enabled: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div>
          <label className="font-medium block mb-2">
            Average Interval (minutes)
          </label>
          <p className="text-sm text-slate-600 mb-2">
            Average time between posts (probability-based)
          </p>
          <input
            type="number"
            min="1"
            step="0.5"
            value={config.averageIntervalMins}
            onChange={(e) =>
              setConfig({
                ...config,
                averageIntervalMins: parseFloat(e.target.value),
              })
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
          />
        </div>

        <Button
          onClick={handleSaveConfig}
          disabled={saving}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Configuration"
          )}
        </Button>
      </div>

      <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div>
          <h3 className="font-medium text-blue-900 mb-1">Manual Trigger</h3>
          <p className="text-sm text-blue-700">
            Run the enrichment service immediately with 100% probability
          </p>
        </div>

        <Button
          onClick={handleRunNow}
          disabled={running}
          variant="outline"
          className="w-full"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating post...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run Now
            </>
          )}
        </Button>
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <p>
          <strong>Note:</strong> The enrichment service creates mock debate posts in the "Test" community
        </p>
        <p>Each post includes a topic and 3 sample statements</p>
        <p>Probability: 1 / averageIntervalMins (checked every cron run)</p>
      </div>
    </div>
  );
}