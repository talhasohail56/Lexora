import Link from "next/link";
import { redirect } from "next/navigation";
import { Scale, Users } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AcceptInviteButton } from "./accept-client";

export default async function InvitePage({ params }: { params: { token: string } }) {
  const invitation = await prisma.firmInvitation.findUnique({
    where: { token: params.token },
    include: {
      firm: true,
      invitedBy: { select: { name: true, email: true } },
    },
  });
  if (!invitation) redirect("/login?error=invite_not_found");

  const session = await getSession();
  const next = `/invite/${params.token}`;
  const isPending = invitation.status === "PENDING" && invitation.expiresAt.getTime() > Date.now();
  const emailMatches = session?.email?.toLowerCase() === invitation.email.toLowerCase();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090806] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:46px_46px] opacity-35" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(140,240,218,0.18),transparent_30%),radial-gradient(circle_at_80%_16%,rgba(214,122,45,0.26),transparent_36%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.8fr_1fr]">
          <section className="relative hidden min-h-[520px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/80">
              <Scale className="h-4 w-4 text-[#8ff3d6]" />
              LEXORA TEAM
            </div>
            <div className="absolute bottom-10 left-8 right-8">
              <p className="mb-4 text-xs uppercase tracking-[0.16em] text-white/40">Firm access / shared documents / private by default</p>
              <h1 className="text-5xl font-semibold leading-[0.96]">Join the firm workspace.</h1>
              <p className="mt-5 text-sm leading-6 text-white/50">Once accepted, you only see documents that the firm owner or document owner shares with you.</p>
            </div>
            <div className="absolute right-10 top-32 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_38%_28%,#ffd49a,#d7782f_48%,#4b170c_84%)] shadow-[0_0_120px_rgba(214,122,45,0.36)]" />
          </section>

          <section className="rounded-[2rem] border border-white/12 bg-[#14110d]/88 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[#8ff3d6]">
              <Users className="h-4 w-4" />
              Firm invitation
            </div>
            <h2 className="text-4xl font-semibold leading-tight">{invitation.firm.name}</h2>
            <p className="mt-3 text-sm leading-6 text-white/50">
              {invitation.invitedBy.name} invited <span className="text-white">{invitation.email}</span> to join this firm workspace.
            </p>

            <div className="my-7 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="text-xs uppercase tracking-[0.14em] text-white/35">Invitation status</div>
              <div className="mt-2 text-lg font-semibold">
                {isPending ? "Ready to accept" : invitation.status === "ACCEPTED" ? "Already accepted" : "No longer active"}
              </div>
              <div className="mt-1 text-sm text-white/45">Role: {invitation.role}</div>
            </div>

            {!isPending ? (
              <Link href="/login" className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-white text-base font-semibold text-black hover:bg-white/90">
                Go to Lexora
              </Link>
            ) : session && emailMatches ? (
              <AcceptInviteButton token={params.token} />
            ) : session && !emailMatches ? (
              <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                You are signed in as {session.email}. This invitation is for {invitation.email}. Sign out and use the invited email.
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  href={`/register?email=${encodeURIComponent(invitation.email)}&invite=${encodeURIComponent(params.token)}&next=${encodeURIComponent(next)}`}
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-white text-base font-semibold text-black hover:bg-white/90"
                >
                  Create account with invited email
                </Link>
                <Link
                  href={`/login?email=${encodeURIComponent(invitation.email)}&next=${encodeURIComponent(next)}`}
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] text-base font-semibold text-white hover:bg-white/[0.10]"
                >
                  I already have an account
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
