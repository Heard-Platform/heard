import { Button } from "../ui/button";
import { Sparkles, Wand2, HelpCircle } from "lucide-react";
import { TopicDescriptionFields } from "./TopicDescriptionFields";
import { FunSheetCard } from "../FunSheet";
import { SeedStatements } from "./SeedStatements";
import { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface ComposePostStepProps {
  topic: string;
  description: string;
  statements: string[];
  onTopicChange: (topic: string) => void;
  onDescriptionChange: (description: string) => void;
  onStatementsChange: (statements: string[]) => void;
  onSwitchToRantMode: () => void;
  showError: boolean;
}

export function ComposePostStep({
  topic,
  description,
  statements,
  onTopicChange,
  onDescriptionChange,
  onStatementsChange,
  onSwitchToRantMode,
  showError,
}: ComposePostStepProps) {
  const { t } = useTranslation("create");
  const iconGreen = "w-5 h-5 text-green-500";
  const labelText = "text-base text-slate-700";

  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  return (
    <>
      <FunSheetCard delay={0.15}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className={iconGreen} />
            <span className={labelText}>{t("conversationLabel")}</span>
          </div>
          <TopicDescriptionFields
            topic={topic}
            description={description}
            onTopicChange={onTopicChange}
            onDescriptionChange={onDescriptionChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-green-700 hover:text-green-900 hover:bg-green-100/50 flex items-center gap-1 h-auto px-2 py-1 -ml-2"
            onClick={() => setIsHelpDialogOpen(true)}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {t("howDoesThisWork")}
          </Button>
        </div>
      </FunSheetCard>

      <SeedStatements
        statements={statements}
        onStatementsChange={onStatementsChange}
        variant="green"
        showError={showError}
      />

      <FunSheetCard delay={0.25}>
        <div className="text-center space-y-3">
          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-600 mb-3">
              {t("preferRant")}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={onSwitchToRantMode}
              className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-300 hover:border-purple-400"
            >
              <Wand2 className="w-4 h-4 mr-2 text-purple-600" />
              <span className="text-purple-700">{t("switchToRantMode")}</span>
            </Button>
          </div>
        </div>
      </FunSheetCard>

      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">{t("helpDialogTitle")}</DialogTitle>
            <DialogDescription className="text-slate-600">
              <Trans t={t} i18nKey="helpDialogDescription" components={{ strong: <strong /> }} />
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-sm text-slate-700">{t("helpTopicLabel")}</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {t("helpExampleTopic")}
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-green-500" />
                <span className="font-semibold text-sm text-slate-700">{t("seedStatementsLabel")}</span>
              </div>
              <div className="space-y-2">
                <div className="bg-white rounded-md p-3 border border-green-200">
                  <p className="text-sm text-slate-700">{t("helpExampleStatement1")}</p>
                </div>
                <div className="bg-white rounded-md p-3 border border-green-200">
                  <p className="text-sm text-slate-700">{t("helpExampleStatement2")}</p>
                </div>
                <div className="bg-white rounded-md p-3 border border-green-200">
                  <p className="text-sm text-slate-700">{t("helpExampleStatement3")}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                {t("helpClusterNote")}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
