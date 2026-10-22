## Event tracking

To log any client-side event (button taps, views, etc.), call `api.trackEvent`.

## Server file naming

Services are named with a `service-` prefix, e.g. `service-flyer-results-email.ts`. Routes stay in `*-api.ts` files and call into the service.

## Code comments

Do not comment code unless it is highly technical or mathematical.

## Property order

In type and interface definitions, order properties logically, by how prominently they are used. Timestamps such as `createdAt` and `updatedAt` always go last. When adding a field to an existing type, put it in its logical spot rather than appending it.

## Testing in the browser

Claude never runs the app or stories in a browser and never tests there. Claude writes code and runs unit tests, typecheck and build; Alex does all browser and end-to-end testing.
