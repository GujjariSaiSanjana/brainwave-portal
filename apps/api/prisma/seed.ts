import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { SEEDED_EMAILS } from "../src/config/demo.js";
import { ALL_PERMISSION_KEYS, PERMISSION_CATALOG, PERMISSIONS, SYSTEM_ROLES } from "../src/config/permissions.js";

const prisma = new PrismaClient();
const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? "Password123!";

const departments = ["Human Resources", "Sales", "Support", "Finance", "Engineering"];

const roles: { slug: string; name: string; description: string; isSystem: boolean; permissions: string[] }[] = [
  { slug: SYSTEM_ROLES.ADMIN, name: "Admin", description: "Full access to the portal and every integration", isSystem: true, permissions: ALL_PERMISSION_KEYS },
  { slug: SYSTEM_ROLES.MANAGER, name: "Manager", description: "Sees their department's team and activity", isSystem: true, permissions: [PERMISSIONS.TEAM_READ, PERMISSIONS.AUDIT_READ] },
  { slug: SYSTEM_ROLES.EMPLOYEE, name: "Employee", description: "Baseline access with no Zoho services", isSystem: true, permissions: [] },
  { slug: "hr", name: "HR", description: "Human resources via Zoho People", isSystem: false, permissions: [PERMISSIONS.ZOHO_PEOPLE] },
  { slug: "sales", name: "Sales", description: "Sales and customer relationships via Zoho CRM", isSystem: false, permissions: [PERMISSIONS.ZOHO_CRM] },
  { slug: "support", name: "Support", description: "Support ticketing via Zoho Desk", isSystem: false, permissions: [PERMISSIONS.ZOHO_DESK] },
  { slug: "finance", name: "Finance", description: "Accounting and invoicing via Zoho Books", isSystem: false, permissions: [PERMISSIONS.ZOHO_BOOKS] },
];

const users: { email: string; firstName: string; lastName: string; department: string | null; roles: string[] }[] = [
  { email: "admin@brainwave.dev", firstName: "Asha", lastName: "Menon", department: null, roles: ["admin"] },
  { email: "manager@brainwave.dev", firstName: "Vikram", lastName: "Sethi", department: "Sales", roles: ["manager", "sales"] },
  { email: "hr@brainwave.dev", firstName: "Sanjana", lastName: "Gujjari", department: "Human Resources", roles: ["hr"] },
  { email: "sales@brainwave.dev", firstName: "Arjun", lastName: "Reddy", department: "Sales", roles: ["sales"] },
  { email: "support@brainwave.dev", firstName: "Neha", lastName: "Kapoor", department: "Support", roles: ["support"] },
  { email: "finance@brainwave.dev", firstName: "Lakshmi", lastName: "Nair", department: "Finance", roles: ["finance"] },
  { email: "employee@brainwave.dev", firstName: "Rahul", lastName: "Verma", department: "Engineering", roles: ["employee"] },
];

const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function main() {
  for (const u of users) {
    if (!(SEEDED_EMAILS as readonly string[]).includes(u.email)) throw new Error(`${u.email} is missing from SEEDED_EMAILS`);
  }
  for (const p of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { description: p.description, group: p.group },
      create: p,
    });
  }

  for (const name of departments) {
    await prisma.department.upsert({ where: { slug: slugify(name) }, update: { name }, create: { name, slug: slugify(name) } });
  }

  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { slug: r.slug },
      update: { name: r.name, description: r.description, isSystem: r.isSystem },
      create: { slug: r.slug, name: r.name, description: r.description, isSystem: r.isSystem },
    });
    const perms = await prisma.permission.findMany({ where: { key: { in: r.permissions } }, select: { id: true } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({ data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })) });
  }

  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });

  for (const u of users) {
    const department = u.department ? await prisma.department.findUniqueOrThrow({ where: { slug: slugify(u.department) } }) : null;
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { firstName: u.firstName, lastName: u.lastName, departmentId: department?.id ?? null },
      create: { email: u.email, firstName: u.firstName, lastName: u.lastName, passwordHash, departmentId: department?.id ?? null },
    });
    const roleRows = await prisma.role.findMany({ where: { slug: { in: u.roles } }, select: { id: true } });
    await prisma.userRole.deleteMany({ where: { userId: user.id } });
    await prisma.userRole.createMany({ data: roleRows.map((r) => ({ userId: user.id, roleId: r.id })) });
  }

  console.log(`Seeded ${PERMISSION_CATALOG.length} permissions, ${roles.length} roles, ${departments.length} departments, ${users.length} users.`);
  console.log(`Demo password for every account: ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
