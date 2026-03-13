import { verifyAdminKey } from "./admin-api.tsx";
import { validateSessionContext } from "./auth-utils.ts";
import { AUTH_ERROR_401_MESSAGE } from "./constants.tsx";
import { validateDeveloperContext } from "./internal-utils.ts";

interface ParamConfig {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  validate?: (value: any) => boolean;
  errorMessage?: string;
}

export enum AuthType {
  NONE = 'none',
  USER = 'user',
  DEVELOPER = 'developer',
  ADMIN = 'admin',
}

export function defineRoute<TInput extends Record<string, any>, TOutput>(
  schema: Record<keyof TInput, ParamConfig>,
  handler: (params: TInput, userId: string | null) => Promise<TOutput>,
  errorMessage: string,
  auth: AuthType = AuthType.NONE,
) {
  return async (c: any) => {
    let validatedUserId: string | null = null;

    if (auth === AuthType.USER) {
      try {
        validatedUserId = await validateSessionContext(c);
      } catch {
        return c.json({ error: AUTH_ERROR_401_MESSAGE }, 401);
      }
    } else if (auth === AuthType.DEVELOPER) {
      try {
        validatedUserId = await validateDeveloperContext(c);
      } catch (error: any) {
        return c.json({ error: error.message }, error.message === AUTH_ERROR_401_MESSAGE ? 401 : 403);
      }
    } else if (auth === AuthType.ADMIN) {
      const failureResponse = await verifyAdminKey(c, () => {})
      if (failureResponse) return failureResponse
    }

    try {
      const body = await c.req.json().catch(() => ({}));
      const validatedParams: any = {};
      
      for (const [key, config] of Object.entries(schema) as [string, ParamConfig][]) {
        const value = body[key];
        
        if (config.required && value === undefined) {
          return c.json({ error: `${key} is required` }, 400);
        }
        
        if (value !== undefined) {
          if (typeof value !== config.type) {
            return c.json({ 
              error: config.errorMessage || `${key} must be a ${config.type}` 
            }, 400);
          }
          
          if (config.validate && !config.validate(value)) {
            return c.json({ 
              error: config.errorMessage || `${key} is invalid` 
            }, 400);
          }
        }
        
        validatedParams[key] = value;
      }
      
      const result = await handler(validatedParams as TInput, validatedUserId);
      return c.json({ success: true, ...result });
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      return c.json({ success: false, error: errorMessage }, 500);
    }
  };
}