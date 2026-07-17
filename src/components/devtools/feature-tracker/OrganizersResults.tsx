import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../ui/table";

interface OrganizersResultsProps {
  pageView: number; pageViewUsers: number;
  scrolledBelowFold: number; scrolledBelowFoldUsers: number;
  demoVoteAgree: number;
  demoVoteDisagree: number;
  demoVotePass: number;
  demoVoteSuperAgree: number;
  demoCompleted: number; demoCompletedUsers: number;
  clickScheduleTop: number; clickScheduleTopUsers: number;
  clickScheduleBottom: number; clickScheduleBottomUsers: number;
  clickFounderLinkedin: number;
  clickFounderInstagram: number;
  clickFounderYoutube: number;
  clickVtaiwanLink: number;
  clickExitLogo: number;
  clickTestimonialBeagleFreedomProject: number;
  clickTestimonialInterdependanceDay: number;
  resultsExpanded: number; resultsExpandedUsers: number;
  resultsCollapsed: number;
  resultsLoadError: number;
}

export function OrganizersResults(props: OrganizersResultsProps) {
  const {
    pageView, pageViewUsers,
    scrolledBelowFold, scrolledBelowFoldUsers,
    demoVoteAgree,
    demoVoteDisagree,
    demoVotePass,
    demoVoteSuperAgree,
    demoCompleted, demoCompletedUsers,
    clickScheduleTop, clickScheduleTopUsers,
    clickScheduleBottom, clickScheduleBottomUsers,
    clickFounderLinkedin,
    clickFounderInstagram,
    clickFounderYoutube,
    clickVtaiwanLink,
    clickExitLogo,
    clickTestimonialBeagleFreedomProject,
    clickTestimonialInterdependanceDay,
    resultsExpanded, resultsExpandedUsers,
    resultsCollapsed,
    resultsLoadError,
  } = props;

  const rate = (n: number, of: number) =>
    of === 0 ? undefined : ((n / of) * 100).toFixed(1);

  const demoVotesTotal = demoVoteAgree + demoVoteDisagree + demoVotePass + demoVoteSuperAgree;

  const steps = [
    { label: "Page Views", count: pageView, users: pageViewUsers },
    { label: "Scrolled Below Fold", count: scrolledBelowFold, users: scrolledBelowFoldUsers, rate: rate(scrolledBelowFold, pageView) },
    { label: "Demo Votes — Agree", count: demoVoteAgree, rate: rate(demoVoteAgree, demoVotesTotal) },
    { label: "Demo Votes — Disagree", count: demoVoteDisagree, rate: rate(demoVoteDisagree, demoVotesTotal) },
    { label: "Demo Votes — Pass", count: demoVotePass, rate: rate(demoVotePass, demoVotesTotal) },
    { label: "Demo Votes — Super Agree", count: demoVoteSuperAgree, rate: rate(demoVoteSuperAgree, demoVotesTotal) },
    { label: "Demo Completed", count: demoCompleted, users: demoCompletedUsers, rate: rate(demoCompleted, pageView) },
    { label: "Schedule CTA Clicked — Top", count: clickScheduleTop, users: clickScheduleTopUsers, rate: rate(clickScheduleTop, pageView) },
    { label: "Schedule CTA Clicked — Bottom", count: clickScheduleBottom, users: clickScheduleBottomUsers, rate: rate(clickScheduleBottom, pageView) },
    { label: "Results Expanded", count: resultsExpanded, users: resultsExpandedUsers, rate: rate(resultsExpanded, pageView) },
    { label: "Results Collapsed", count: resultsCollapsed, rate: rate(resultsCollapsed, resultsExpanded) },
    { label: "Results Load Errors", count: resultsLoadError, rate: rate(resultsLoadError, resultsExpanded) },
    { label: "Founder LinkedIn Clicked", count: clickFounderLinkedin, rate: rate(clickFounderLinkedin, pageView) },
    { label: "Founder Instagram Clicked", count: clickFounderInstagram, rate: rate(clickFounderInstagram, pageView) },
    { label: "Founder YouTube Clicked", count: clickFounderYoutube, rate: rate(clickFounderYoutube, pageView) },
    { label: "vTaiwan Link Clicked", count: clickVtaiwanLink, rate: rate(clickVtaiwanLink, pageView) },
    { label: "Testimonial — Beagle Freedom Project", count: clickTestimonialBeagleFreedomProject, rate: rate(clickTestimonialBeagleFreedomProject, pageView) },
    { label: "Testimonial — InterdepenDance Day", count: clickTestimonialInterdependanceDay, rate: rate(clickTestimonialInterdependanceDay, pageView) },
    { label: "Exit Logo Clicked", count: clickExitLogo, rate: rate(clickExitLogo, pageView) },
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
            <TableCell className="text-right text-muted-foreground">
              {step.users !== undefined ? step.users : "—"}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {step.rate !== undefined ? `${step.rate}%` : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
