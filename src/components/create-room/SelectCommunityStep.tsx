import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Hash, Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FunSheetCard } from "../FunSheet";
import { api } from "../../utils/api";
import { formatSubHeardDisplay } from "../../utils/subheard";
import type { SubHeard } from "../../types";

interface SelectCommunityStepProps {
  subHeard: string;
  newSubHeardName: string;
  defaultSubHeard?: string;
  userId: string;
  onSubHeardChange: (subHeard: string) => void;
  onNewSubHeardNameChange: (name: string) => void;
}

export function SelectCommunityStep({
  subHeard,
  newSubHeardName,
  defaultSubHeard,
  userId,
  onSubHeardChange,
  onNewSubHeardNameChange,
}: SelectCommunityStepProps) {
  const [subHeards, setSubHeards] = useState<SubHeard[]>([]);
  const [loadingSubHeards, setLoadingSubHeards] = useState(true);
  const [showCreateNew, setShowCreateNew] = useState(false);

  useEffect(() => {
    loadSubHeards();
  }, []);

  useEffect(() => {
    if (defaultSubHeard && !subHeard) {
      // Only auto-select if nothing is currently selected
      onSubHeardChange(defaultSubHeard);
    }
  }, [defaultSubHeard, subHeard, onSubHeardChange]);

  const loadSubHeards = async () => {
    try {
      setLoadingSubHeards(true);
      const response = await api.getSubHeards(userId);
      if (response.success && response.data) {
        setSubHeards(response.data.subHeards || []);
      }
    } catch (error) {
      console.error("Failed to load sub-heards:", error);
    } finally {
      setLoadingSubHeards(false);
    }
  };

  const handleSelectSubHeard = (name: string) => {
    onSubHeardChange(name);
    setShowCreateNew(false);
    onNewSubHeardNameChange("");
  };

  const handleCreateNewClick = () => {
    setShowCreateNew(true);
    onSubHeardChange("create-new");
  };

  // Sort communities with defaultSubHeard at the top if it exists
  const sortedSubHeards = [...subHeards].sort((a, b) => {
    if (a.name === defaultSubHeard) return -1;
    if (b.name === defaultSubHeard) return 1;
    // @ts-ignore
    return b.count - a.count; // Otherwise sort by count
  });

  return (
    <>
      <FunSheetCard delay={0.3}>
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-5 h-5 text-purple-600" />
            <Label className="text-base text-slate-700">
              Choose a community
            </Label>
          </div>

          {loadingSubHeards ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-slate-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {sortedSubHeards.map((sh, index) => {
                const isSelected = subHeard === sh.name;
                const isDefault = sh.name === defaultSubHeard;

                return (
                  <motion.div
                    key={sh.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => handleSelectSubHeard(sh.name)}
                      className={`w-full h-auto py-3 px-4 flex items-start justify-between transition-all ${
                        isSelected
                          ? "bg-purple-100 border-purple-400 border-2 hover:bg-purple-100"
                          : "bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50"
                      } ${isDefault ? "ring-2 ring-purple-300 ring-offset-2" : ""}`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${
                            isSelected
                              ? "bg-purple-500 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Hash className="w-4 h-4" />
                          )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className={`${
                              isSelected ? "text-purple-900" : "text-slate-700"
                            }`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="break-words">{formatSubHeardDisplay(sh.name)}</span>
                              {isDefault && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-200 text-purple-700 whitespace-nowrap">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="text-xs mt-1 text-slate-500">
                              {sh.count} {sh.count === 1 ? "debate" : "debates"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                );
              })}

              {/* Create New Button */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: sortedSubHeards.length * 0.03 }}
              >
                <Button
                  variant="outline"
                  onClick={handleCreateNewClick}
                  className={`w-full h-auto py-3 px-4 flex items-center justify-between transition-all ${
                    showCreateNew
                      ? "bg-purple-100 border-purple-400 border-2 hover:bg-purple-100"
                      : "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 border-dashed border-2 hover:border-purple-400 hover:from-purple-100 hover:to-pink-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                        showCreateNew
                          ? "bg-purple-500 text-white"
                          : "bg-purple-500/20 text-purple-600"
                      }`}
                    >
                      {showCreateNew ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </div>
                    <span
                      className={
                        showCreateNew ? "text-purple-900" : "text-purple-700"
                      }
                    >
                      Create New Community
                    </span>
                  </div>
                  <span className="text-xl">✨</span>
                </Button>
              </motion.div>
            </div>
          )}

          {/* Create new sub-heard input */}
          <AnimatePresence>
            {showCreateNew && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl space-y-2">
                  <Label htmlFor="new-subheard-name" className="text-sm text-purple-800">
                    New Community Name
                  </Label>
                  <Input
                    id="new-subheard-name"
                    placeholder="e.g., politics, technology, food..."
                    value={newSubHeardName}
                    onChange={(e) => onNewSubHeardNameChange(e.target.value)}
                    maxLength={50}
                    className="bg-white border-purple-300"
                    autoFocus
                  />
                  <p className="text-xs text-purple-700">
                    Choose a clear, concise name for your community
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </FunSheetCard>
    </>
  );
}