import { useState } from "react";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { FlyerSensorsView } from "./FlyerSensorsView";
import type { RoomOption } from "./RoomPicker";
import type { FlyerPlacementsSavePayload } from "./save-payload";
import type { FlyerVoteTally } from "./flyer-votes";
import { parseAccelerometerCsv, parseLocationCsv } from "./parse-sensor-csv";
import type { AccelerometerSample, LocationFix } from "./sensor-types";

type LoadState<T> =
  | { status: "empty" }
  | { status: "loading"; fileName: string }
  | { status: "loaded"; fileName: string; records: T[]; loadId: number }
  | { status: "error"; fileName: string; message: string };

interface CsvUploadFieldProps<T> {
  id: string;
  label: string;
  state: LoadState<T>;
  recordNoun: string;
  onFileSelected: (file: File) => void;
}

function describeLoadState<T>(state: LoadState<T>, recordNoun: string): string {
  switch (state.status) {
    case "empty":
      return "No file selected";
    case "loading":
      return `Parsing ${state.fileName}…`;
    case "loaded":
      return `${state.fileName}: ${state.records.length.toLocaleString()} ${recordNoun}`;
    case "error":
      return `${state.fileName}: ${state.message}`;
  }
}

function CsvUploadField<T>({ id, label, state, recordNoun, onFileSelected }: CsvUploadFieldProps<T>) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="file"
        accept=".csv,text/csv"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
        }}
      />
      <p className={`text-xs ${state.status === "error" ? "text-red-600" : "text-slate-500"}`}>
        {describeLoadState(state, recordNoun)}
      </p>
    </div>
  );
}

let nextLoadId = 1;

function useCsvLoader<T>(parse: (file: File) => Promise<T[]>) {
  const [state, setState] = useState<LoadState<T>>({ status: "empty" });

  const load = async (file: File) => {
    setState({ status: "loading", fileName: file.name });
    try {
      const records = await parse(file);
      setState({ status: "loaded", fileName: file.name, records, loadId: nextLoadId++ });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to parse CSV";
      setState({ status: "error", fileName: file.name, message });
    }
  };

  return [state, load] as const;
}

interface FlyerSensorsTabProps {
  rooms: RoomOption[];
  roomsLoading: boolean;
  loadFlyerVotes: (roomId: string) => Promise<FlyerVoteTally[]>;
  onSave: (payload: FlyerPlacementsSavePayload) => Promise<void>;
}

export function FlyerSensorsTab({ rooms, roomsLoading, loadFlyerVotes, onSave }: FlyerSensorsTabProps) {
  const [accelerometer, loadAccelerometer] = useCsvLoader<AccelerometerSample>(parseAccelerometerCsv);
  const [location, loadLocation] = useCsvLoader<LocationFix>(parseLocationCsv);

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Flyer Sensors</h2>
          <p className="text-sm text-slate-600">
            Upload Accelerometer.csv and Location.csv from the same phone recording. Each triple tap marks a flyer, which is placed at the GPS position where you were standing just before it. Files stay in the browser.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <CsvUploadField
            id="flyer-sensors-accelerometer"
            label="Accelerometer CSV"
            state={accelerometer}
            recordNoun="samples"
            onFileSelected={loadAccelerometer}
          />
          <CsvUploadField
            id="flyer-sensors-location"
            label="Location CSV"
            state={location}
            recordNoun="GPS fixes"
            onFileSelected={loadLocation}
          />
        </div>
      </Card>

      {accelerometer.status === "loaded" && location.status === "loaded" && (
        <FlyerSensorsView
          key={`${accelerometer.loadId}-${location.loadId}`}
          accelerometerSamples={accelerometer.records}
          locationFixes={location.records}
          rooms={rooms}
          roomsLoading={roomsLoading}
          loadFlyerVotes={loadFlyerVotes}
          onSave={onSave}
        />
      )}
    </div>
  );
}
