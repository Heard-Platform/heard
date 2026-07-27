import { useState, useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";
import alexPointingImg from "figma:asset/alex-pointing.png";
import step2Img from "figma:asset/1b-step2.png";
import step3Img from "figma:asset/1b-step3.png";
import { api } from "../utils/api";

// @ts-ignore
import { toast } from "sonner@2.0.3";

const ORG_NAME = "1 Billion for Trust";
const ORG_URL = "https://www.1billionfortrust.org/";
const CONTEST_URL =
  "https://docs.google.com/document/d/1aG_OROjAH_Q-0d6rt6cIead3RD-3dRL_/edit";
const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSe19duLGInd8JV8z-psgtvk2sFU2SMuFxCzu-QjDj5I1wVCrQ/viewform";
const HEARD_NUMBER = "9";
const SHARE_URL = "https://heard.vote/1billion";

interface StepRowProps {
  number: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function StepRow({ number, title, description, children }: StepRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-10 border-t border-slate-200">
      <div>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white text-xl font-bold">
            {number}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            {title}
          </h2>
        </div>
        {description && (
          <p className="text-slate-600 text-lg leading-relaxed ml-16">
            {description}
          </p>
        )}
      </div>
      <div className="flex justify-center">{children}</div>
    </div>
  );
}

function ScreenshotPlaceholder({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="w-full max-w-sm rounded-lg overflow-hidden border border-slate-200 shadow-md bg-slate-50">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto block"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
          (e.currentTarget.nextElementSibling as HTMLElement).style.display =
            "flex";
        }}
      />
      <div
        className="hidden items-center justify-center h-64 text-slate-400 text-sm px-4 text-center"
      >
        Screenshot placeholder. Drop file at <code className="mx-1">{src}</code>
      </div>
    </div>
  );
}

export function OneBillionPage() {
  const { t } = useTranslation(["screens", "toast"]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.trackEvent("one_billion_page_load");
  }, []);

  const handleCopy = async () => {
    api.trackEvent("one_billion_click_copy");
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      toast.success(t("toast:linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("toast:copyFailedManual"));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <header className="text-center mb-12">
          <div className="text-6xl mb-4">🐒</div>
          <div className="inline-block px-4 py-1 mb-4 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold uppercase tracking-wide">
            {t("obTopTen")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {t("obTitle", { org: ORG_NAME })}
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8">
            <Trans
              t={t}
              i18nKey="obIntro"
              values={{ org: ORG_NAME }}
              components={{
                org: (
                  <a
                    href={ORG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => api.trackEvent("one_billion_click_org")}
                    className="text-indigo-600 hover:text-indigo-700 underline"
                  />
                ),
              }}
            />
          </p>
          <a
            href={CONTEST_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => api.trackEvent("one_billion_click_projects")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-50 font-semibold transition-colors"
          >
            {t("obSeeProjects")}
            <ExternalLink className="w-5 h-5" />
          </a>
        </header>

        <p className="text-center text-slate-500 text-sm mb-2">
          {t("obVotingTakes")}
        </p>

        <StepRow
          number={1}
          title={t("obStep1Title")}
          description={t("obStep1Desc")}
        >
          <a
            href={FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => api.trackEvent("one_billion_click_form")}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold shadow-lg transition-colors"
          >
            {t("obOpenForm")}
            <ExternalLink className="w-5 h-5" />
          </a>
        </StepRow>

        <StepRow
          number={2}
          title={t("obStep2Title")}
          description={t("obStep2Desc")}
        >
          <ScreenshotPlaceholder
            src={step2Img}
            alt={t("obStep2Alt")}
          />
        </StepRow>

        <StepRow
          number={3}
          title={t("obStep3Title", { number: HEARD_NUMBER })}
          description={t("obStep3Desc", { number: HEARD_NUMBER })}
        >
          <ScreenshotPlaceholder
            src={step3Img}
            alt={t("obStep3Alt", { number: HEARD_NUMBER })}
          />
        </StepRow>

        <section className="mt-20 max-w-xl mx-auto rounded-2xl bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            <img
              src={alexPointingImg}
              alt="Alex"
              className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-white shrink-0"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                {t("obYouRock")}
              </h2>
              <p className="text-slate-700 leading-relaxed mb-2">
                {t("obRockStar")}
              </p>
              <p>- Alex</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            <input
              type="text"
              readOnly
              value={SHARE_URL}
              onClick={(e) => e.currentTarget.select()}
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-700 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button
              onClick={handleCopy}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow-md"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  {t("obCopied")}
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  {t("obCopyLink")}
                </>
              )}
            </Button>
          </div>
        </section>

        <footer className="text-center mt-16 text-slate-400 text-sm">
          {t("obFooter")}
        </footer>
      </div>
    </div>
  );
}
