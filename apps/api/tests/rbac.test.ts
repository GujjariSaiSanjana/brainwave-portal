import { hasAllPermissions, hasAnyPermission, hasPermission, resolvePermissions } from "../src/rbac/engine";

describe("rbac engine", () => {
  const roles = [
    { slug: "manager", permissions: ["team:read", "audit:read"] },
    { slug: "sales", permissions: ["zoho:crm"] },
  ];

  it("unions permissions across roles", () => {
    const granted = resolvePermissions(roles);
    expect([...granted].sort()).toEqual(["audit:read", "team:read", "zoho:crm"]);
  });

  it("checks single permissions", () => {
    const granted = resolvePermissions(roles);
    expect(hasPermission(granted, "zoho:crm")).toBe(true);
    expect(hasPermission(granted, "zoho:books")).toBe(false);
  });

  it("requires every permission for hasAll and any for hasAny", () => {
    const granted = resolvePermissions(roles);
    expect(hasAllPermissions(granted, ["team:read", "zoho:crm"])).toBe(true);
    expect(hasAllPermissions(granted, ["team:read", "users:write"])).toBe(false);
    expect(hasAnyPermission(granted, ["users:write", "zoho:crm"])).toBe(true);
    expect(hasAnyPermission(granted, [])).toBe(false);
  });

  it("grants nothing to a user without roles", () => {
    expect(resolvePermissions([]).size).toBe(0);
  });
});
