export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "TOKEN_EXPIRED"
  | "INVALID_CREDENTIALS"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "ZOHO_NOT_CONNECTED"
  | "ZOHO_ERROR"
  | "INTERNAL";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, "VALIDATION_ERROR", message, details);
  }
  static unauthenticated(message = "Authentication required") {
    return new AppError(401, "UNAUTHENTICATED", message);
  }
  static tokenExpired() {
    return new AppError(401, "TOKEN_EXPIRED", "Session expired");
  }
  static invalidCredentials() {
    return new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  static forbidden(message = "You do not have permission to perform this action") {
    return new AppError(403, "FORBIDDEN", message);
  }
  static notFound(entity = "Resource") {
    return new AppError(404, "NOT_FOUND", `${entity} not found`);
  }
  static conflict(message: string) {
    return new AppError(409, "CONFLICT", message);
  }
  static zohoNotConnected() {
    return new AppError(503, "ZOHO_NOT_CONNECTED", "Zoho is not connected. An administrator needs to connect it first.");
  }
  static zohoError(message: string, details?: unknown) {
    return new AppError(502, "ZOHO_ERROR", message, details);
  }
}
