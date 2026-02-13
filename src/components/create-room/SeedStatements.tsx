import { useState } from "react";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { MessageCircle, Edit2, Trash2, CheckCircle2, Plus } from "lucide-react";
import { motion } from "motion/react";

interface SeedStatementsProps {
  statements: string[];
  onStatementsChange: (statements: string[]) => void;
  variant?: "blue" | "green";
}

export function SeedStatements({ 
  statements, 
  onStatementsChange,
  variant = "blue"
}: SeedStatementsProps) {
  const [editingStatementIndex, setEditingStatementIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newStatementText, setNewStatementText] = useState("");

  const colors = variant === "blue" 
    ? {
        cardBg: "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 transition-all hover:border-blue-300",
        buttonBg: "bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100",
        buttonBorder: "border-2 border-dashed border-blue-300 hover:border-blue-400",
        primaryButton: "bg-blue-600 hover:bg-blue-700",
        iconColor: "w-5 h-5 text-blue-500",
        iconBlue: "text-blue-600",
        editHover: "hover:bg-blue-100 border border-blue-200",
      }
    : {
        cardBg: "bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 transition-all hover:border-green-300",
        buttonBg: "bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100",
        buttonBorder: "border-2 border-dashed border-green-300 hover:border-green-400",
        primaryButton: "bg-green-600 hover:bg-green-700",
        iconColor: "w-5 h-5 text-green-500",
        iconBlue: "text-green-600",
        editHover: "hover:bg-green-100 border border-green-200",
      };

  const handleDeleteStatement = (index: number) => {
    onStatementsChange(statements.filter((_, i) => i !== index));
  };

  const handleAddNewStatement = () => {
    const trimmedText = newStatementText.trim();
    if (trimmedText) {
      onStatementsChange([...statements, trimmedText]);
      setNewStatementText("");
      setIsAddingNew(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-base text-slate-700 flex items-center gap-2">
          <MessageCircle className={colors.iconColor} />
          Seed Statements ({statements.length})
        </Label>
      </div>

      <div className="space-y-3">
        {statements.map((stmt, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative group"
          >
            <div className={colors.cardBg}>
              {editingStatementIndex === index ? (
                <div className="space-y-2">
                  <Textarea
                    value={stmt}
                    onChange={(e) => {
                      const newStatements = [...statements];
                      newStatements[index] = e.target.value;
                      onStatementsChange(newStatements);
                    }}
                    className="w-full min-h-[80px] resize-none bg-white border-blue-200"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setEditingStatementIndex(null)}
                      className={colors.primaryButton}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingStatementIndex(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-700 leading-relaxed pr-20">
                    {stmt}
                  </p>
                  <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingStatementIndex(index)}
                      className={`h-8 w-8 p-0 bg-white/80 ${colors.editHover}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStatement(index)}
                      className="h-8 w-8 p-0 bg-white/80 hover:bg-red-100 border border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {statements.length === 0 && (
        <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No statements yet</p>
        </div>
      )}

      {isAddingNew ? (
        <div className="relative group">
          <div className={colors.cardBg}>
            <Textarea
              value={newStatementText}
              onChange={(e) => setNewStatementText(e.target.value)}
              className="w-full min-h-[80px] resize-none bg-white border-blue-200 mb-3"
              autoFocus
              placeholder="Enter a statement to kickstart the conversation..."
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddNewStatement}
                className={colors.primaryButton}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAddingNew(false);
                  setNewStatementText("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsAddingNew(true)}
          className={`w-full h-auto py-4 ${colors.buttonBg} ${colors.buttonBorder}`}
        >
          <Plus className={`w-5 h-5 ${colors.iconBlue}`} />
          Add New Statement
        </Button>
      )}
    </div>
  );
}