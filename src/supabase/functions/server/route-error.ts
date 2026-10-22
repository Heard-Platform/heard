export type RouteErrorStatus = 400 | 403 | 404 | 409 | 423;

export class RouteError extends Error {
  constructor(message: string, readonly status: RouteErrorStatus) {
    super(message);
    this.name = "RouteError";
  }
}
