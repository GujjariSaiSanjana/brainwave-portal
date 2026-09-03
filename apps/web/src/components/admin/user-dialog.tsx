"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { Department, Role, UserSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DepartmentSelect } from "./department-select";
import { RoleChecklist } from "./role-checklist";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserSummary | null;
  roles: Role[];
  departments: Department[];
  onSaved: () => void;
}

interface FormState {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  isActive: boolean;
  departmentId: string | null;
  roleIds: string[];
}

const empty: FormState = {
  email: "",
  firstName: "",
  lastName: "",
  password: "",
  isActive: true,
  departmentId: null,
  roleIds: [],
};

export function UserDialog({ open, onOpenChange, user, roles, departments, onSaved }: Props) {
  const editing = user !== null;
  const [form, setForm] = useState<FormState>(() =>
    user
      ? {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          password: "",
          isActive: user.isActive,
          departmentId: user.department?.id ?? null,
          roleIds: user.roles.map((r) => r.id),
        }
      : empty,
  );
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        await api.patch(`/api/users/${user.id}`, {
          firstName: form.firstName,
          lastName: form.lastName,
          isActive: form.isActive,
          departmentId: form.departmentId,
          ...(form.password ? { password: form.password } : {}),
        });
        await api.put(`/api/users/${user.id}/roles`, { roleIds: form.roleIds });
        toast.success("User updated");
      } else {
        await api.post("/api/users", {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          password: form.password,
          departmentId: form.departmentId ?? undefined,
          roleIds: form.roleIds,
        });
        toast.success("User created");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err, "Unable to save user"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="contents">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit user" : "New user"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update profile details, status, department, and roles."
                : "Create a portal account and assign roles."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  required
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  required
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                disabled={editing}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{editing ? "Reset password" : "Password"}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required={!editing}
                minLength={8}
                placeholder={editing ? "Leave blank to keep current password" : undefined}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <DepartmentSelect
                id="department"
                departments={departments}
                value={form.departmentId}
                onChange={(v) => set("departmentId", v)}
              />
            </div>

            {editing ? (
              <Label htmlFor="isActive" className="justify-between">
                <span>Account active</span>
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(c) => set("isActive", c)}
                />
              </Label>
            ) : null}

            <div className="space-y-2">
              <Label>Roles</Label>
              <RoleChecklist
                roles={roles}
                selected={form.roleIds}
                onChange={(ids) => set("roleIds", ids)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : editing ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
