import { experience } from "@/content/experience";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { SITE_PAGES } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

// A plain-text summary for AI assistants and LLM crawlers (llmstxt.org), built from the same content.
export const dynamic = "force-static";

export function GET() {
  const lines = [
    `# ${profile.name}`,
    "",
    `> ${profile.role}. ${profile.headline}. Based in ${profile.location}. ${profile.openTo}.`,
    "",
    profile.summary,
    "",
    "## Pages",
    ...SITE_PAGES.map((p) => `- [${p.label}](${absoluteUrl(p.path)})`),
    `- [CV](${absoluteUrl("/cv/")}): printable CV, also as a PDF at ${absoluteUrl(profile.cvPdf)}`,
    `- [Chat](${absoluteUrl("/")}): ask about my work in a chat interface`,
    "",
    "## Experience",
    ...experience.map((j) => `- ${j.role}, ${j.company} (${j.period}, ${j.location})`),
    "",
    "## Projects",
    ...projects.map((p) => `- [${p.name}](${absoluteUrl(`/projects/${p.id}/`)}): ${p.tagline}`),
    "",
    "## Contact",
    `- Email: ${profile.email}`,
    `- LinkedIn: ${profile.links.linkedin}`,
    `- GitHub: ${profile.links.github}`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
