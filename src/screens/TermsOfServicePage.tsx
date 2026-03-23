import { TOS } from "../utils/constants/terms-of-service";
import { LegalDocumentRenderer } from "../components/LegalDocumentRenderer";

export function TermsOfServicePage() {
  return <LegalDocumentRenderer content={TOS} />;
}