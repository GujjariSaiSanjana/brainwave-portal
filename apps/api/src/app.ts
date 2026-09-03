import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env, isProduction } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { authenticate } from "./middleware/authenticate.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { apiRateLimiter, enforceHttps, requireJsonForMutations } from "./middleware/security.js";
import { auditRouter } from "./modules/audit/audit.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { departmentsRouter } from "./modules/departments/departments.routes.js";
import { permissionsRouter } from "./modules/permissions/permissions.routes.js";
import { rolesRouter } from "./modules/roles/roles.routes.js";
import { teamRouter } from "./modules/team/team.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { zohoPublicRouter, zohoRouter } from "./modules/zoho/zoho.routes.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(enforceHttps);
  app.use(
    helmet({
      hsts: isProduction ? { maxAge: 31_536_000, includeSubDomains: true } : false,
      contentSecurityPolicy: false,
    }),
  );
  app.use(cors({ origin: env.WEB_URL, credentials: true }));
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/api/health" } }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(apiRateLimiter);
  app.use(requireJsonForMutations);

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRouter);
  app.use("/api/zoho", zohoPublicRouter);
  app.use("/api/zoho", zohoRouter);

  // Everything below requires a valid session.
  app.use("/api", authenticate);
  app.use("/api/users", usersRouter);
  app.use("/api/roles", rolesRouter);
  app.use("/api/permissions", permissionsRouter);
  app.use("/api/departments", departmentsRouter);
  app.use("/api/audit", auditRouter);
  app.use("/api/team", teamRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
