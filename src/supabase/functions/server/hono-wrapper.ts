import { Hono } from "npm:hono";
import { validateSession } from "./auth-utils.ts";
import { validateDeveloper } from "./internal-utils.ts";

export class AuthedHono extends Hono {
  constructor() {
    super();
    this.use("/*", validateSession);
  }
}

export class DevAuthedHono extends Hono {
  constructor() {
    super();
    this.use("/*", validateDeveloper);
  }
}