import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../ui/table";

interface FundingResultsProps {
  pageView: number; pageViewUsers: number;
  swipeDonate: number; swipeDonateUsers: number;
  amountPickerOpened: number; amountPickerOpenedUsers: number;
  amountSelected: number; amountSelectedUsers: number;
  customAmountConfirmed: number; customAmountConfirmedUsers: number;
  checkoutStarted: number; checkoutStartedUsers: number;
  checkoutError: number; checkoutErrorUsers: number;
  donationSuccess: number; donationSuccessUsers: number;
  shareCopy: number; shareCopyUsers: number;
  shareNative: number; shareNativeUsers: number;
  shareDismissed: number; shareDismissedUsers: number;
  goToHeardClicked: number; goToHeardClickedUsers: number;
  substackLinkClicked: number; substackLinkClickedUsers: number;
  nugmodeToggled: number; nugmodeToggledUsers: number;
  exitClicked: number; exitClickedUsers: number;
  fallbackDonate: number; fallbackDonateUsers: number;
}

export function FundingResults(props: FundingResultsProps) {
  const {
    pageView, pageViewUsers,
    swipeDonate, swipeDonateUsers,
    amountPickerOpened, amountPickerOpenedUsers,
    amountSelected, amountSelectedUsers,
    customAmountConfirmed, customAmountConfirmedUsers,
    checkoutStarted, checkoutStartedUsers,
    checkoutError, checkoutErrorUsers,
    donationSuccess, donationSuccessUsers,
    shareCopy, shareCopyUsers,
    shareNative, shareNativeUsers,
    shareDismissed, shareDismissedUsers,
    goToHeardClicked, goToHeardClickedUsers,
    substackLinkClicked, substackLinkClickedUsers,
    nugmodeToggled, nugmodeToggledUsers,
    exitClicked, exitClickedUsers,
    fallbackDonate, fallbackDonateUsers,
  } = props;

  const rate = (n: number, of: number) =>
    of === 0 ? undefined : ((n / of) * 100).toFixed(1);

  const steps = [
    { label: "Page Views", count: pageView, users: pageViewUsers },
    { label: "Swiped to Donate", count: swipeDonate, users: swipeDonateUsers, rate: rate(swipeDonate, pageView) },
    { label: "Fallback Donate Clicked", count: fallbackDonate, users: fallbackDonateUsers, rate: rate(fallbackDonate, pageView) },
    { label: "Checkout Started", count: checkoutStarted, users: checkoutStartedUsers, rate: rate(checkoutStarted, pageView) },
    { label: "Donation Success", count: donationSuccess, users: donationSuccessUsers, rate: rate(donationSuccess, pageView) },
    { label: "Checkout Errors", count: checkoutError, users: checkoutErrorUsers, rate: rate(checkoutError, checkoutStarted) },
    { label: "Amount Picker Opened", count: amountPickerOpened, users: amountPickerOpenedUsers, rate: rate(amountPickerOpened, pageView) },
    { label: "Preset Amount Selected", count: amountSelected, users: amountSelectedUsers, rate: rate(amountSelected, amountPickerOpened) },
    { label: "Custom Amount Confirmed", count: customAmountConfirmed, users: customAmountConfirmedUsers, rate: rate(customAmountConfirmed, amountPickerOpened) },
    { label: "Share - Copy Link", count: shareCopy, users: shareCopyUsers, rate: rate(shareCopy, donationSuccess) },
    { label: "Share - Native", count: shareNative, users: shareNativeUsers, rate: rate(shareNative, donationSuccess) },
    { label: "Share Dismissed", count: shareDismissed, users: shareDismissedUsers, rate: rate(shareDismissed, donationSuccess) },
    { label: "\"Go to Heard\" Clicked", count: goToHeardClicked, users: goToHeardClickedUsers, rate: rate(goToHeardClicked, donationSuccess) },
    { label: "Substack Link Clicked", count: substackLinkClicked, users: substackLinkClickedUsers, rate: rate(substackLinkClicked, pageView) },
    { label: "Nuggie Mode Toggled", count: nugmodeToggled, users: nugmodeToggledUsers, rate: rate(nugmodeToggled, pageView) },
    { label: "Exit Clicked", count: exitClicked, users: exitClickedUsers, rate: rate(exitClicked, pageView) },
  ];

  return (
    <Table className="w-96">
      <TableHeader>
        <TableRow>
          <TableHead>Event</TableHead>
          <TableHead className="text-right">Events</TableHead>
          <TableHead className="text-right">Users</TableHead>
          <TableHead className="text-right">Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {steps.map((step) => (
          <TableRow key={step.label}>
            <TableCell className="text-muted-foreground">{step.label}</TableCell>
            <TableCell className="text-right font-bold">{step.count}</TableCell>
            <TableCell className="text-right text-muted-foreground">{step.users}</TableCell>
            <TableCell className="text-right text-muted-foreground">
              {step.rate !== undefined ? `${step.rate}%` : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
