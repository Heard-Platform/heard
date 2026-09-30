import { useEffect, useState } from "react";
import { api, safelyMakeApiCall } from "../../../utils/api";
// @ts-ignore
import { toast } from "sonner@2.0.3";

export function ClusterNamingToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await safelyMakeApiCall(() => api.getClusterNamingConfig());
      if (response?.success && response.data) {
        setEnabled(response.data.enabled);
      } else {
        toast.error("Failed to load auto-naming setting");
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleToggle = async (next: boolean) => {
    setSaving(true);
    const response = await safelyMakeApiCall(() => api.setClusterNamingConfig({ enabled: next }));
    if (response?.success && response.data) {
      setEnabled(response.data.enabled);
      toast.success(`Auto-naming ${response.data.enabled ? "on" : "off"}`);
    } else {
      toast.error("Failed to update auto-naming setting");
    }
    setSaving(false);
  };

  return (
    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
      <div>
        <label className="font-medium">Auto-naming</label>
        <p className="text-sm text-slate-600">
          Name new clusters and check for drift automatically after each recompute
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          disabled={loading || saving}
          onChange={(e) => handleToggle(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}
