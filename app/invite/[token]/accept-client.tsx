"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function accept() {
    setLoading(true);
    try {
      const response = await fetch(`/api/team/invitations/${token}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not accept invitation");
      toast.success(`Joined ${data.firm.name}`);
      router.push("/team");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  return (
    <Button onClick={accept} disabled={loading} className="h-12 w-full rounded-xl bg-white text-base font-semibold text-black hover:bg-white/90">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
      Accept invitation
    </Button>
  );
}
