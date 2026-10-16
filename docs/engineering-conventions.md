## Event tracking

To log any client-side event (button taps, views, etc.), call `api.trackEvent`.

## Server file naming

Services are named with a `service-` prefix, e.g. `service-flyer-results-email.ts`. Routes stay in `*-api.ts` files and call into the service.
