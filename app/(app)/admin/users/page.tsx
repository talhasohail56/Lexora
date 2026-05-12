"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/animated/page-transition";
import { toast } from "sonner";
import { formatRelative } from "@/lib/utils";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => { refresh(); }, []);
  async function refresh() { setUsers(await fetch("/api/admin/users").then((r) => r.json())); }

  async function setRole(id: string, role: string) {
    await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    toast.success("Role updated");
    refresh();
  }
  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    toast.success("Status updated");
    refresh();
  }

  const filtered = users.filter(
    (u) =>
      (roleFilter === "ALL" || u.role === roleFilter) &&
      (!q || u.email.toLowerCase().includes(q.toLowerCase()) || u.name.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <PageTransition>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-7 w-7 text-lex-500" /> User management
            </h1>
            <p className="text-muted-foreground">{users.length} users in the system</p>
          </div>
        </div>

        <GlowCard className="p-4">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" className="pl-9" />
            </div>
            {["ALL", "USER", "LAWYER", "ADMIN"].map((r) => (
              <Button key={r} variant={roleFilter === r ? "default" : "outline"} size="sm" onClick={() => setRoleFilter(r)}>{r}</Button>
            ))}
          </div>

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Role</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Joined</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-t border-border hover:bg-accent/30"
                  >
                    <td className="p-3">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant={u.role === "ADMIN" ? "gradient" : u.role === "LAWYER" ? "info" : "outline"}>{u.role}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={u.status === "ACTIVE" ? "success" : u.status === "SUSPENDED" ? "warning" : "destructive"}>{u.status}</Badge>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{formatRelative(u.createdAt)}</td>
                    <td className="p-3 flex gap-1">
                      {u.role === "USER" && <Button size="sm" variant="ghost" onClick={() => setRole(u.id, "LAWYER")}>Promote</Button>}
                      {u.role === "LAWYER" && <Button size="sm" variant="ghost" onClick={() => setRole(u.id, "USER")}>Demote</Button>}
                      {u.status === "ACTIVE"
                        ? <Button size="sm" variant="ghost" onClick={() => setStatus(u.id, "SUSPENDED")}>Suspend</Button>
                        : <Button size="sm" variant="ghost" onClick={() => setStatus(u.id, "ACTIVE")}>Reactivate</Button>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlowCard>
      </div>
    </PageTransition>
  );
}
