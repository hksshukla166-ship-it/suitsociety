import { existsSync } from "fs";
import { join } from "path";
import { isMysqlConfigured } from "@/lib/db/pool";

export interface EnvConfig {
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  NEXT_PUBLIC_SITE_URL: string;
  NEXT_PUBLIC_RAZORPAY_KEY_ID: string;
}

const REQUIRED_VARS = [] as const;

export function isSetupComplete(): boolean {
  const setupFile = join(process.cwd(), ".setup-complete");
  if (existsSync(setupFile)) return true;
  return isMysqlConfigured();
}

export function getMissingEnvVars(): string[] {
  if (isMysqlConfigured()) return [];
  return ["DATABASE_URL or MYSQL_HOST/MYSQL_USER/MYSQL_DATABASE"];
}

export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing = getMissingEnvVars();
  return { valid: missing.length === 0, missing: [...missing] };
}

export function isEnvConfigured(): boolean {
  return isSetupComplete();
}

export function getEnvConfig(): EnvConfig {
  return {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    NEXT_PUBLIC_RAZORPAY_KEY_ID:
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "",
  };
}
