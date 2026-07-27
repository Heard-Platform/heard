import { Trans, useTranslation } from "react-i18next";

export function TOSText() {
  const { t } = useTranslation("account");
  return (
    <p className="text-xs text-muted-foreground">
      <Trans
        t={t}
        i18nKey="tosText"
        components={{
          terms: <a href="/terms" className="heard-link underline" />,
          privacy: <a href="/privacy" className="heard-link underline" />,
        }}
      />
    </p>
  );
}