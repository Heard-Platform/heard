import { useState } from "react";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import type { NewFlyerPlacementsRequest, RoomFlyerPlacements } from "../../../utils/dev-api";
import { FlyerSensorsView } from "./FlyerSensorsView";
import { RoomSearchPicker, type RoomSearchOption } from "../../RoomSearchPicker";
import { StatementPicker } from "./StatementPicker";
import { useRoomFlyers, type RoomFlyersState } from "./use-room-flyers";
import { parseAccelerometerCsv, parseLocationCsv } from "./parse-sensor-csv";
import type { AccelerometerSample, LocationFix, SensorRecording } from "./sensor-types";

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

const INITIAL_RECORDING_FILE_NAME = "Sample recording";

let nextLoadId = 1;

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

function describeRoomFlyers(state: RoomFlyersState): { text: string; isError: boolean } | null {
  switch (state.status) {
    case "idle":
      return null;
    case "loading":
      return { text: "Loading saved flyers…", isError: false };
    case "error":
      return { text: `Couldn't load saved flyers: ${state.message}`, isError: true };
    case "loaded": {
      const { flyers } = state.roomFlyers;
      const votes = flyers.reduce((sum, flyer) => sum + flyer.agrees + flyer.disagrees, 0);
      return { text: `${flyers.length} saved flyers with ${votes} flyer votes in this room`, isError: false };
    }
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

function initialLoadState<T>(records: T[] | undefined): LoadState<T> {
  if (!records) return { status: "empty" };
  return { status: "loaded", fileName: INITIAL_RECORDING_FILE_NAME, records, loadId: nextLoadId++ };
}

function useCsvLoader<T>(parse: (file: File) => Promise<T[]>, initialRecords: T[] | undefined) {
  const [state, setState] = useState<LoadState<T>>(() => initialLoadState(initialRecords));

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

  const clear = () => setState({ status: "empty" });

  return { state, load, clear };
}

interface FlyerSensorsTabProps {
  rooms: RoomSearchOption[];
  roomsLoading: boolean;
  initialRecording?: SensorRecording;
  loadRoomFlyers: (roomId: string) => Promise<RoomFlyerPlacements>;
  saveFlyers: (request: NewFlyerPlacementsRequest) => Promise<void>;
}

export function FlyerSensorsTab({
  rooms,
  roomsLoading,
  initialRecording,
  loadRoomFlyers,
  saveFlyers,
}: FlyerSensorsTabProps) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [statementId, setStatementId] = useState<string | null>(null);
  const [uploadResetCount, setUploadResetCount] = useState(0);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const accelerometer = useCsvLoader<AccelerometerSample>(parseAccelerometerCsv, initialRecording?.accelerometerSamples);
  const location = useCsvLoader<LocationFix>(parseLocationCsv, initialRecording?.locationFixes);
  const roomFlyers = useRoomFlyers(roomId, loadRoomFlyers);

  const loadedRoom = roomFlyers.state.status === "loaded" ? roomFlyers.state.roomFlyers : null;
  const roomDescription = describeRoomFlyers(roomFlyers.state);
  const loadedRecording =
    accelerometer.state.status === "loaded" && location.state.status === "loaded"
      ? {
          key: `${accelerometer.state.loadId}-${location.state.loadId}`,
          recording: { accelerometerSamples: accelerometer.state.records, locationFixes: location.state.records },
        }
      : null;

  const handleRoomChange = (nextRoomId: string) => {
    setRoomId(nextRoomId);
    setStatementId(null);
    setSavedCount(null);
  };

  const handleSave = async (request: NewFlyerPlacementsRequest) => {
    await saveFlyers(request);
    accelerometer.clear();
    location.clear();
    setUploadResetCount((count) => count + 1);
    setSavedCount(request.flyers.length);
    roomFlyers.reload();
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Flyer Sensors</h2>
          <p className="text-sm text-slate-600">
            Pick a room to see its saved flyers and how many votes each one has brought in. To add flyers, upload Accelerometer.csv and Location.csv from the same phone recording: each triple tap marks a flyer, placed where you were standing just before it.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="flyer-sensors-room">Room</Label>
            <RoomSearchPicker
              id="flyer-sensors-room"
              rooms={rooms}
              selectedRoomId={roomId}
              placeholder="Select a room"
              loading={roomsLoading}
              onSelect={handleRoomChange}
            />
          </div>
          {loadedRoom && (
            <StatementPicker
              statements={loadedRoom.statements}
              selectedStatementId={statementId}
              onChange={setStatementId}
            />
          )}
        </div>
        {roomDescription && (
          <p className={`text-xs ${roomDescription.isError ? "text-red-600" : "text-slate-500"}`}>
            {roomDescription.text}
          </p>
        )}
        {savedCount !== null && <p className="text-sm text-green-700">Saved {savedCount} new flyers.</p>}
        <div key={uploadResetCount} className="grid md:grid-cols-2 gap-4">
          <CsvUploadField
            id="flyer-sensors-accelerometer"
            label="Accelerometer CSV"
            state={accelerometer.state}
            recordNoun="samples"
            onFileSelected={accelerometer.load}
          />
          <CsvUploadField
            id="flyer-sensors-location"
            label="Location CSV"
            state={location.state}
            recordNoun="GPS fixes"
            onFileSelected={location.load}
          />
        </div>
      </Card>

      {(loadedRoom || loadedRecording) && (
        <FlyerSensorsView
          key={`${roomId ?? "no-room"}-${loadedRecording?.key ?? "no-recording"}`}
          savedFlyers={loadedRoom?.flyers ?? []}
          recording={loadedRecording?.recording ?? null}
          roomId={roomId}
          statementId={statementId}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
