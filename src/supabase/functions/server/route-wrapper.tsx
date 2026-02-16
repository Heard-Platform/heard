interface ParamConfig {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  validate?: (value: any) => boolean;
  errorMessage?: string;
}

export function defineRoute<TInput extends Record<string, any>, TOutput>(
  schema: Record<keyof TInput, ParamConfig>,
  handler: (params: TInput) => Promise<TOutput>,
  errorMessage: string
) {
  return async (c: any) => {
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
      
      const result = await handler(validatedParams as TInput);
      return c.json({ success: true, ...result });
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      return c.json({ success: false, error: errorMessage }, 500);
    }
  };
}