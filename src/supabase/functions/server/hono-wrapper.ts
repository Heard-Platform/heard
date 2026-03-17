import { Hono } from "npm:hono";
import { validateSession } from "./auth-utils.ts";

export class AuthedHono extends Hono {
  constructor() {
    super();
    this.use("/*", validateSession);
  }
}