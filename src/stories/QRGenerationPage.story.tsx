import { useState } from "react";
import { QRGenerationPage } from "../components/results/QRGenerationPage";
import { mockStatements } from "./mockData";
import { Button } from "../components/ui/button";

export function Story() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        Open QR Generation Page
      </Button>
      {isOpen && (
        <QRGenerationPage
          statement={mockStatements["debate-no-image"][0]}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
