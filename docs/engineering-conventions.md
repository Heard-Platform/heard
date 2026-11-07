## Event tracking

To log any client-side event (button taps, views, etc.), call `api.trackEvent`.

## Server file naming

A service is only something that performs a recurring, independent task on its own schedule, such as a cron job or a scheduled email send (the standard definition of a service). Services are named with a `service-` prefix, e.g. `service-flyer-results-email.ts`. Code that a route calls to do its work is not a service, even when it sends an email. Routes stay in `*-api.ts` files.

## Naming

Since code has no comments, names have to carry the meaning. Name every variable, function, prop and type so a reader who has never seen the code knows exactly what it holds or does.

- Spell it out. No abbreviations, shorthand or clipped phrases: `roomStatementsOnBoard`, not `roomOnBoard`; `isLatestStatementOnBoard`, not `isOnBoard`.
- Say what kind of thing it is: a list of statements is `...Statements`, a list of their ids is `...StatementIds`, a boolean reads as a yes/no question (`is`, `has`, `can`).
- Never reuse a word that already means something else in Heard. "Room" is a post (`DebateRoom`, `roomId`), so a statement written by someone at an event is an attendee statement in code, even though the UI says "From the room".
- Longer and clear beats shorter and ambiguous. If a name needs a comment to be understood, rename it.
- Callback handlers start with `handle`: `onStart={handleStart}`, never `onStart={start}`.

## No shortcuts

Write the clear, complete version the first time, not the quick one: clear names, small functions that each do one thing, shared logic pulled out instead of copied, real types instead of casts. A shortcut that saves a minute now costs every future reader.

## Readable over clever

Favor the version a reader understands at a glance over a compact trick. If one expression does two jobs (a filter that drops two different things at once, a ternary that both picks and builds), split it into named steps. Example: in a multi-select toggle, first drop the opt-out answer, then add or remove the tapped option, rather than doing both in one filter.

## Colors

Every color comes from a semantic class in `src/semantic_classes.css`, never a raw Tailwind color (`text-white`, `text-foreground`, `bg-slate-100`). Name classes for what the color means, not where it's used or how it looks. Note `normal-text` is white (text on colored buttons); dark text on a light card is `dark-text`, muted text is `secondary-text`.

## Code comments

Do not comment code unless it is highly technical or mathematical.

## Property order

In type and interface definitions, order properties logically, by how prominently they are used. Timestamps such as `createdAt` and `updatedAt` always go last. When adding a field to an existing type, put it in its logical spot rather than appending it.

## Testing in the browser

Claude never runs the app or stories in a browser and never tests there. Claude writes code and runs unit tests, typecheck and build; Alex does all browser and end-to-end testing.
