import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Upload, FileText, Users, AlertCircle, CheckCircle, Info } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";
import type { SubHeard } from "../types";

interface PolisImporterProps {
  subHeards: SubHeard[];
  currentUserId: string;
  onImportComplete?: () => void;
}

type DryRunResult = {
  summary: {
    debateName: string;
    subHeard: string;
    userCount: number;
    statementCount: number;
    voteCount: number;
    avgVotesPerStatement: string;
  };
  room: {
    topic: string;
    phase: string;
    mode: string;
    participantCount: number;
  };
  voteDistribution: {
    agree: number;
    disagree: number;
    pass: number;
  };
  samples: {
    users: Array<{ nickname: string; email: string; isTestUser: boolean }>;
    statements: Array<{ text: string; author: string; agrees: number; disagrees: number; passes: number }>;
  };
  warnings: string[];
};

export function PolisImporter({
  subHeards,
  currentUserId,
  onImportComplete,
}: PolisImporterProps) {
  const [debateName, setDebateName] = useState("");
  const [selectedSubHeard, setSelectedSubHeard] = useState("");
  const [statementsFile, setStatementsFile] = useState<File | null>(null);
  const [votesFile, setVotesFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);

  const adminSubHeards = subHeards.filter(sh => sh.adminId === currentUserId);

  const handleDryRun = async () => {
    if (!debateName.trim()) {
      toast.error("Please enter a debate name");
      return;
    }

    if (!selectedSubHeard) {
      toast.error("Please select a community");
      return;
    }

    if (!statementsFile || !votesFile) {
      toast.error("Please upload both CSV files");
      return;
    }

    setIsImporting(true);

    try {
      const statementsText = await statementsFile.text();
      const votesText = await votesFile.text();

      const response = await api.importPolisData({
        debateName,
        subHeard: selectedSubHeard,
        statementsCSV: statementsText,
        votesCSV: votesText,
        importerId: currentUserId,
        dryRun: true,
      });

      if (response.success && response.data) {
        setDryRunResult(response.data as DryRunResult);
        toast.success("Preview generated successfully");
      } else {
        toast.error(response.error || "Failed to generate preview");
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      toast.error("Failed to generate preview");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    if (!debateName.trim()) {
      toast.error("Please enter a debate name");
      return;
    }

    if (!selectedSubHeard) {
      toast.error("Please select a community");
      return;
    }

    if (!statementsFile || !votesFile) {
      toast.error("Please upload both CSV files");
      return;
    }

    setIsImporting(true);

    try {
      const statementsText = await statementsFile.text();
      const votesText = await votesFile.text();

      const response = await api.importPolisData({
        debateName,
        subHeard: selectedSubHeard,
        statementsCSV: statementsText,
        votesCSV: votesText,
        importerId: currentUserId,
        dryRun: false,
      });

      if (response.success) {
        toast.success(`Successfully imported debate with ${response.data?.userCount} users and ${response.data?.statementCount} statements!`);
        setDebateName("");
        setSelectedSubHeard("");
        setStatementsFile(null);
        setVotesFile(null);
        setDryRunResult(null);
        
        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        toast.error(response.error || "Failed to import Polis data");
      }
    } catch (error) {
      console.error("Error importing Polis data:", error);
      toast.error("Failed to import Polis data");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-purple-600" />
          <h3>Import Polis Data</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="debate-name">Debate Name</Label>
            <Input
              id="debate-name"
              value={debateName}
              onChange={(e) => setDebateName(e.target.value)}
              placeholder="Enter debate topic..."
              disabled={isImporting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subheard-select">Community</Label>
            {adminSubHeards.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                <AlertCircle className="w-4 h-4" />
                <span>You need to be an admin of a community to import data</span>
              </div>
            ) : (
              <select
                id="subheard-select"
                value={selectedSubHeard}
                onChange={(e) => setSelectedSubHeard(e.target.value)}
                disabled={isImporting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a community...</option>
                {adminSubHeards.map((sh) => (
                  <option key={sh.name} value={sh.name}>
                    #{sh.name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statements-file">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Statements CSV
                </div>
              </Label>
              <Input
                id="statements-file"
                type="file"
                accept=".csv"
                onChange={(e) => setStatementsFile(e.target.files?.[0] || null)}
                disabled={isImporting}
              />
              {statementsFile && (
                <p className="text-xs text-muted-foreground">
                  {statementsFile.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="votes-file">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Votes CSV
                </div>
              </Label>
              <Input
                id="votes-file"
                type="file"
                accept=".csv"
                onChange={(e) => setVotesFile(e.target.files?.[0] || null)}
                disabled={isImporting}
              />
              {votesFile && (
                <p className="text-xs text-muted-foreground">
                  {votesFile.name}
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleDryRun}
            disabled={isImporting || !debateName.trim() || !selectedSubHeard || !statementsFile || !votesFile || adminSubHeards.length === 0}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isImporting ? "Generating preview..." : "Generate Preview"}
          </Button>

          {dryRunResult && (
            <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="text-green-900">Import Preview Ready</h4>
              </div>

              {dryRunResult.warnings.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-700" />
                    <span className="text-sm text-yellow-900">Warnings</span>
                  </div>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {dryRunResult.warnings.map((warning, idx) => (
                      <li key={idx}>&bull; {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-md border border-gray-200">
                  <div className="text-xs text-gray-600">Users</div>
                  <div className="text-lg">{dryRunResult.summary.userCount}</div>
                </div>
                <div className="p-3 bg-white rounded-md border border-gray-200">
                  <div className="text-xs text-gray-600">Statements</div>
                  <div className="text-lg">{dryRunResult.summary.statementCount}</div>
                </div>
                <div className="p-3 bg-white rounded-md border border-gray-200">
                  <div className="text-xs text-gray-600">Votes</div>
                  <div className="text-lg">{dryRunResult.summary.voteCount}</div>
                </div>
                <div className="p-3 bg-white rounded-md border border-gray-200">
                  <div className="text-xs text-gray-600">Avg Votes/Stmt</div>
                  <div className="text-lg">{dryRunResult.summary.avgVotesPerStatement}</div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-md border border-gray-200">
                <div className="text-xs text-gray-600 mb-2">Vote Distribution</div>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">✓ {dryRunResult.voteDistribution.agree} agrees</span>
                  <span className="text-red-600">✗ {dryRunResult.voteDistribution.disagree} disagrees</span>
                  <span className="text-gray-600">− {dryRunResult.voteDistribution.pass} passes</span>
                </div>
              </div>

              <details className="p-3 bg-white rounded-md border border-gray-200">
                <summary className="text-sm cursor-pointer flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Sample Data Preview
                </summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Sample Users (first 3)</div>
                    <div className="text-xs space-y-1 text-gray-700">
                      {dryRunResult.samples.users.map((user, idx) => (
                        <div key={idx}>{user.nickname}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Sample Statements (first 5)</div>
                    <div className="text-xs space-y-1 text-gray-700">
                      {dryRunResult.samples.statements.map((stmt, idx) => (
                        <div key={idx} className="truncate">{stmt.text}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </details>

              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isImporting ? "Importing..." : "Confirm Import"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}