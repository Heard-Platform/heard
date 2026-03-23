import { Hono } from "npm:hono";
import { validateSession } from "./auth-utils.ts";
import { validateAdmin } from "./internal-utils.ts";

export class AuthedHono extends Hono {
  constructor() {
    super();
    this.use("/*", validateSession);
  }
}

export class AdminHono extends Hono {
  constructor() {
    super();
    this.use("/*", validateAdmin);
  }
}