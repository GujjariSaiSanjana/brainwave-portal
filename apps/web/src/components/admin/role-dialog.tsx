"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { Permission, Role } from "@/lib/types";
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
import { Textarea } from "@/components/ui/textarea";
import { PermissionChecklist } from "./permission-checklist";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  permissions: Permission[];
  onSaved: () => void;
}

export function RoleDialog({ open, onOpenChange, role, permissions, onSaved }: Props) {
  const editing = role !== null;
  const locked = role?.slug === "admin";
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [keys, setKeys] = useState<string[]>(role?.permissions ?? []);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        if (!role.isSystem) {
          await api.patch(`/api/roles/${role.id}`, { name, description: description || null });
        }
        if (!locked) {
          await api.put(`/api/roles/${role.id}/permissions`, { permissionKeys: keys });
        }
        toast.success("Role updated");
      } else {
        await api.post("/api/roles", {
          name,
          description: description || undefined,
          permissionKeys: keys,
        });
        toast.success("Role created");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err, "Unable to save role"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="contents">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${role.name}` : "New role"}</DialogTitle>
            <DialogDescription>
              {locked
                ? "The administrator role always holds every permission."
                : "Choose the permissions this role grants."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Name</Label>
              <Input
                id="roleName"
                required
                disabled={editing && role.isSystem}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleDescription">Description</Label>
              <Textarea
                id="roleDescription"
                rows={2}
                disabled={editing && role.isSystem}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <PermissionChecklist
                permissions={permissions}
                selected={keys}
                onChange={setKeys}
                disabled={locked}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || locked}>
              {busy ? "Saving…" : editing ? "Save changes" : "Create role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
