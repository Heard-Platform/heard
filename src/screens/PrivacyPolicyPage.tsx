import { PRIVACY_POLICY } from "../utils/constants/privacy-policy";
import { LegalDocumentRenderer } from "../components/LegalDocumentRenderer";

export function PrivacyPolicyPage() {
  return <LegalDocumentRenderer content={PRIVACY_POLICY} />;
}