/// <reference types="node" />
import 'dotenv/config';
import process from "node:process";

// Middleware to verify admin key
export const verifyAdminKey = async (c: any, next: any) => {
    const adminKey = c.req.header("X-Admin-Key");
    const validKey = process.env.DEV_ADMIN_KEY;
    // const validKey = Deno.env.get("DEV_ADMIN_KEY");

    console.log(adminKey, validKey, adminKey === validKey);

    if (!adminKey || !validKey || adminKey !== validKey) {
        return c.json(
            { error: "Unauthorized - Invalid admin key" },
            401,
        );
    }

    await next();
};