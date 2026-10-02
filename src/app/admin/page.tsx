import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AdminDashboard } from "@/components/admin/dashboard";
import { fallbackIntent, intents } from "@/content/intents";
import { ADMIN_COOKIE, isValidSession } from "@/server/admin-auth";
import { buildAdminData } from "@/server/admin-view";
import { readDb } from "@/server/store";

export const metadata: Metadata = { title: "Feedback inbox", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Without a valid session this page doesn't exist, to anyone.
  if (!(await isValidSession((await cookies()).get(ADMIN_COOKIE)?.value))) notFound();
  const db = await readDb();
  const labels = Object.fromEntries([...intents, fallbackIntent].map((i) => [i.id, i.label]));
  // Only summaries of the event log reach the browser, not every raw event.
  return <AdminDashboard data={buildAdminData(db, labels)} labels={labels} />;
}
