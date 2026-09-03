import type { NextFunction, Request, Response } from "express";
import { authorize } from "../src/middleware/authorize";

function run(permissions: string[], required: string[]) {
  const req = { user: { permissions: new Set(permissions) } } as unknown as Request;
  const next: NextFunction = jest.fn();
  authorize(...required)(req, {} as Response, next);
  return next;
}

describe("authorize middleware", () => {
  it("calls next when the user holds every required permission", () => {
    const next = run(["users:read", "users:write"], ["users:read"]);
    expect(next).toHaveBeenCalledWith();
  });

  it("throws FORBIDDEN when a permission is missing", () => {
    expect(() => run(["users:read"], ["users:write"])).toThrow(expect.objectContaining({ status: 403 }));
  });

  it("throws UNAUTHENTICATED without a user", () => {
    const next: NextFunction = jest.fn();
    expect(() => authorize("users:read")({} as Request, {} as Response, next)).toThrow(
      expect.objectContaining({ status: 401 }),
    );
  });
});
