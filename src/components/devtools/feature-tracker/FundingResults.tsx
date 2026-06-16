import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../ui/table";

interface FundingResultsProps {
  pageView: number;
  swipeDonate: number;
  amountPickerOpened: number;
  amountSelected: number;
  customAmountConfirmed: number;
  checkoutStarted: number;
  checkoutError: number;
  donationSuccess: number;
  shareCopy: number;
  shareNative: number;
  shareDismissed: number;
  goToHeardClicked: number;
  substackLinkClicked: number;
  nugmodeToggled: number;
  exitClicked: number;
}

export function FundingResults({
  pageView,
  swipeDonate,
  amountPickerOpened,
  amountSelected,
  customAmountConfirmed,
  checkoutStarted,
  checkoutError,
  donationSuccess,
  shareCopy,
  shareNative,
  shareDismissed,
  goToHeardClicked,
  substackLinkClicked,
  nugmodeToggled,
  exitClicked,
}: FundingResultsProps) {
  const rate = (n: number, of: number) =>
    of === 0 ? undefined : ((n / of) * 100).toFixed(1);

  const steps = [
    { label: "Page Views", count: pageView },
    { label: "Swiped to Donate", count: swipeDonate, rate: rate(swipeDonate, pageView) },
    { label: "Checkout Started", count: checkoutStarted, rate: rate(checkoutStarted, pageView) },
    { label: "Donation Success", count: donationSuccess, rate: rate(donationSuccess, pageView) },
    { label: "Checkout Errors", count: checkoutError, rate: rate(checkoutError, checkoutStarted) },
    { label: "Amount Picker Opened", count: amountPickerOpened, rate: rate(amountPickerOpened, pageView) },
    { label: "Preset Amount Selected", count: amountSelected, rate: rate(amountSelected, amountPickerOpened) },
    { label: "Custom Amount Confirmed", count: customAmountConfirmed, rate: rate(customAmountConfirmed, amountPickerOpened) },
    { label: "Share - Copy Link", count: shareCopy, rate: rate(shareCopy, donationSuccess) },
    { label: "Share - Native", count: shareNative, rate: rate(shareNative, donationSuccess) },
    { label: "Share Dismissed", count: shareDismissed, rate: rate(shareDismissed, donationSuccess) },
    { label: "\"Go to Heard\" Clicked", count: goToHeardClicked, rate: rate(goToHeardClicked, donationSuccess) },
    { label: "Substack Link Clicked", count: substackLinkClicked, rate: rate(substackLinkClicked, pageView) },
    { label: "Nuggie Mode Toggled", count: nugmodeToggled, rate: rate(nugmodeToggled, pageView) },
    { label: "Exit Clicked", count: exitClicked, rate: rate(exitClicked, pageView) },
  ];

  return (
    <Table className="w-72">
      <TableHeader>
        <TableRow>
          <TableHead>Event</TableHead>
          <TableHead className="text-right">Count</TableHead>
          <TableHead className="text-right">Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {steps.map((step) => (
          <TableRow key={step.label}>
            <TableCell className="text-muted-foreground">{step.label}</TableCell>
            <TableCell className="text-right font-bold">{step.count}</TableCell>
            <TableCell className="text-right text-muted-foreground">
              {step.rate !== undefined ? `${step.rate}%` : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
