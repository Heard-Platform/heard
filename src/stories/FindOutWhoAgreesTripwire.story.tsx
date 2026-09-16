import { useState } from "react";
import { FindOutWhoAgreesTripwire } from "../components/FindOutWhoAgreesTripwire";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default {
  title: "Onboarding/FindOutWhoAgreesTripwire",
};

const STATEMENT_TEXT =
  "Pineapple belongs on pizza and makes it sweet and savory perfection!";

export function FindOutWhoAgreesTripwireStory() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceError, setForceError] = useState(false);

  const handleSubmitEmail = (email: string) => {
    setSubmitting(true);
    setError(null);
    setTimeout(() => {
      setSubmitting(false);
      if (forceError) {
        setError("That email didn't work, mind trying again?");
      } else {
        setIsOpen(false);
      }
    }, 900);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find Out Who Agrees Tripwire</CardTitle>
        <CardDescription>
          Shown right after an anonymous or no-email user posts a statement — timed to
          their moment of buy-in — inviting them to add an email to see who agrees and
          disagrees with them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setForceError(false);
              setError(null);
              setIsOpen(true);
            }}
          >
            Open (happy path)
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setForceError(true);
              setError(null);
              setIsOpen(true);
            }}
          >
            Open (submission fails)
          </Button>
        </div>

        <FindOutWhoAgreesTripwire
          statementText={STATEMENT_TEXT}
          isOpen={isOpen}
          submitting={submitting}
          error={error}
          onSubmitEmail={handleSubmitEmail}
          onDismiss={() => setIsOpen(false)}
        />
      </CardContent>
    </Card>
  );
}
