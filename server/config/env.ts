import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  GEMINI_MODEL_FAST: z.string().default('gemini-3.5-flash-lite'),
  OPEN_METEO_BASE_URL: z.string().default('https://api.open-meteo.com/v1'),
  DAILY_AI_CAP: z.coerce.number().default(100),
  RATE_LIMIT_MAX: z.coerce.number().default(60),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env | null = null;

export function getEnv(): Env {
  if (!parsedEnv) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.warn('Invalid environment variables, falling back to safe defaults:', result.error.format());
      parsedEnv = envSchema.parse({});
    } else {
      parsedEnv = result.data;
    }
  }
  return parsedEnv;
}
