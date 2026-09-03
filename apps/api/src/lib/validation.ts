import type { Request } from "express";
import type { ZodType } from "zod";
import { AppError } from "./errors.js";

function parse<T>(schema: ZodType<T>, data: unknown, source: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    throw AppError.badRequest(`Invalid ${source}`, details);
  }
  return result.data;
}

export const validateBody = <T>(schema: ZodType<T>, req: Request) => parse(schema, req.body, "request body");
export const validateQuery = <T>(schema: ZodType<T>, req: Request) => parse(schema, req.query, "query parameters");
export const validateParams = <T>(schema: ZodType<T>, req: Request) => parse(schema, req.params, "route parameters");
