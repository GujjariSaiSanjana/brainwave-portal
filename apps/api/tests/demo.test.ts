import { assertDemoAllows, assertRoleNotProtected, assertUserNotProtected } from "../src/lib/demo";
import { env } from "../src/config/env";

describe("demo mode guards", () => {
  const mutable = env as { DEMO_MODE: boolean };

  afterEach(() => {
    mutable.DEMO_MODE = false;
  });

  it("does nothing when demo mode is off", () => {
    expect(() => assertUserNotProtected("admin@brainwave.dev", "deleted")).not.toThrow();
    expect(() => assertRoleNotProtected("sales", "deleted")).not.toThrow();
    expect(() => assertDemoAllows("Disconnecting")).not.toThrow();
  });

  it("protects seeded accounts and roles when demo mode is on", () => {
    mutable.DEMO_MODE = true;
    expect(() => assertUserNotProtected("Admin@Brainwave.dev", "deleted")).toThrow(expect.objectContaining({ status: 403 }));
    expect(() => assertUserNotProtected("new.person@example.com", "deleted")).not.toThrow();
    expect(() => assertRoleNotProtected("finance", "deleted")).toThrow(expect.objectContaining({ status: 403 }));
    expect(() => assertRoleNotProtected("ops-analyst", "deleted")).not.toThrow();
    expect(() => assertDemoAllows("Disconnecting Zoho")).toThrow(expect.objectContaining({ status: 403 }));
  });
});
