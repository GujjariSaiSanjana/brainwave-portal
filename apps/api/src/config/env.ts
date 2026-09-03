import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv({ quiet: true });

const durationPattern = /^\d+(ms|s|m|h|d)$/;

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  WEB_URL: z.string().url().default("http://localhost:3000"),
  API_URL: z.string().url().default("http://localhost:4000"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  ACCESS_TOKEN_TTL: z.string().regex(durationPattern).default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  SESSION_IDLE_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(30),
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .refine((v) => Buffer.from(v, "base64").length === 32, "TOKEN_ENCRYPTION_KEY must be 32 bytes, base64 encoded"),
  ZOHO_REGION: z.enum(["in", "com", "eu", "au", "jp", "ca", "sa", "com.cn"]).default("in"),
  ZOHO_CLIENT_ID: z.string().optional().default(""),
  ZOHO_CLIENT_SECRET: z.string().optional().default(""),
  ZOHO_DESK_ORG_ID: z.string().optional().default(""),
  ZOHO_BOOKS_ORG_ID: z.string().optional().default(""),
  ZOHO_MOCK: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  ZOHO_CACHE_TTL_SECONDS: z.coerce.number().int().min(0).default(60),
  // Number of reverse proxies in front of the API (Render alone = 1, Vercel rewrite -> Render = 2).
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  // Protects seeded demo accounts and the Zoho connection when credentials are public.
  DEMO_MODE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

export type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const env = load();
export const isProduction = env.NODE_ENV === "production";
