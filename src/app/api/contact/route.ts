import { bad, clientKey, isEmail, json, limited, newId, readJson, str, visitorFrom } from "@/server/http";
import { MAX_ENTRIES, mutate } from "@/server/store";

export async function POST(req: Request) {
  if (limited(`contact:${clientKey(req)}`, 5, 10 * 60_000)) return bad("Too many messages - please try again later.", 429);
  const body = await readJson(req);
  if (!body) return bad("Invalid request.");
  if (str(body.website, 200)) return json({ ok: true }); // honeypot: bots fill hidden fields

  const visitor = visitorFrom(body.visitor, req);
  const name = str(body.name, 120);
  const email = str(body.email, 200);
  const company = str(body.company, 160);
  const message = str(body.message, 4000);
  if (!visitor) return bad("Missing visitor id.");
  if (!name) return bad("Please add your name.");
  if (!email || !isEmail(email)) return bad("Please add a valid email address.");
  if (!message || message.length < 5) return bad("Please write a short message.");

  const saved = await mutate((db) => {
    if (db.contacts.length >= MAX_ENTRIES) return false;
    db.contacts.push({ id: newId(), createdAt: new Date().toISOString(), visitor, name, email, company, message });
    return true;
  });
  return saved ? json({ ok: true }, 201) : bad("Inbox is full right now - please email instead.", 507);
}
