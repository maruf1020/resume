import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, Mail, MapPin, Phone } from "lucide-react";
import { Github, Linkedin } from "@/components/brand-icons";
import { PrintButton } from "./print-button";
import { cv } from "@/content/cv";
import { quotes } from "@/content/details";
import { profile } from "@/content/profile";
import { describe } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { withBase } from "@/lib/utils";
import "./cv.css";

const cvTitle = `CV - ${profile.name}`;
const cvDescription = describe(`CV of ${profile.name}, ${profile.role}: ${cv.profile}`);

// A child openGraph/twitter object replaces the root layout's, so siteName and the image are repeated here.
export const metadata: Metadata = {
  title: "CV",
  description: cvDescription,
  alternates: { canonical: absoluteUrl("/cv/") },
  openGraph: {
    type: "profile",
    siteName: profile.name,
    title: cvTitle,
    description: cvDescription,
    url: absoluteUrl("/cv/"),
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${profile.name} - ${profile.role}` }],
  },
  twitter: { card: "summary_large_image", title: cvTitle, description: cvDescription, images: ["/og.png"] },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="cv-section">
      <h2 className="cv-h2">{title}</h2>
      {children}
    </section>
  );
}

export default function CvPage() {
  const contacts = [
    { icon: MapPin, label: profile.location },
    { icon: Mail, label: profile.email, href: `mailto:${profile.email}` },
    { icon: Phone, label: profile.phone, href: profile.phoneHref },
    { icon: Linkedin, label: profile.links.linkedinHandle, href: profile.links.linkedin },
    { icon: Github, label: "github.com/maruf1020", href: profile.links.github },
  ];

  return (
    <div className="cv-root">
      <nav aria-label="CV actions" className="cv-toolbar no-print">
        {/* Phones get short labels (full names stay in aria-label), so the pills never wrap. */}
        <Link href="/" className="cv-tool" aria-label="Back to chat">
          <ArrowLeft className="size-4" aria-hidden="true" /> <span className="cv-tool-long">Back to chat</span>
          <span className="cv-tool-short">Chat</span>
        </Link>
        <div className="flex items-center gap-2">
          <PrintButton />
          <a href={withBase(profile.cvPdf)} download className="cv-tool cv-tool-primary" aria-label="Download PDF">
            <Download className="size-4" aria-hidden="true" /> <span className="cv-tool-long">Download PDF</span>
            <span className="cv-tool-short">PDF</span>
          </a>
        </div>
      </nav>

      <main>
        <article className="cv-sheet">
          <header className="cv-header">
            {cv.showPhoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={withBase(cv.photo)} alt={`Photo of ${profile.name}`} width={240} height={240} className="cv-photo" />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="cv-name">{profile.name}</h1>
              <p className="cv-title">{cv.title}</p>
              <ul className="cv-contacts">
                {contacts.map((c) => (
                  <li key={c.label}>
                    <c.icon className="cv-icon" aria-hidden="true" />
                    {c.href ? <a href={c.href}>{c.label}</a> : <span>{c.label}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </header>
          <p className="cv-availability">{cv.availability}</p>

          <Section title="Profile">
            <p className="cv-text">{cv.profile}</p>
          </Section>

          <Section title="Key achievements">
            <ul className="cv-bullets">
              {cv.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </Section>

          <Section title="Core skills">
            <dl className="cv-skills">
              {cv.skills.map((s) => (
                <div key={s.k} className="cv-skill">
                  <dt>{s.k}</dt>
                  <dd>{s.v}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="Professional experience">
            <div className="cv-jobs">
              {cv.experience.map((job) => (
                <div key={job.company} className="cv-job">
                  <div className="cv-row">
                    <h3 className="cv-h3">
                      {job.role} <span className="cv-at">· {job.company}</span>
                    </h3>
                    <span className="cv-date">{job.period}</span>
                  </div>
                  <p className="cv-meta">
                    {job.location}
                    {job.context ? ` · ${job.context}` : ""}
                  </p>
                  <ul className="cv-bullets">
                    {job.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  {job.engagements.map((e) => (
                    <div key={e.title} className="cv-engagement">
                      <div className="cv-row">
                        <h4 className="cv-h4">{e.title}</h4>
                        <span className="cv-date">{e.period}</span>
                      </div>
                      <ul className="cv-bullets">
                        {e.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                      <p className="cv-stack">
                        <span>Stack:</span> {e.stack}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Selected projects">
            <ul className="cv-bullets cv-projects">
              {cv.projects.map((p) => (
                <li key={p.name}>
                  <strong>{p.name}</strong> <span className="cv-faint">({p.meta})</span> - {p.text}
                </li>
              ))}
            </ul>
          </Section>

          <div className="cv-two">
            <Section title="Education">
              <div className="cv-avoid">
                <div className="cv-row">
                  <h3 className="cv-h4">{cv.education.degree}</h3>
                  <span className="cv-date">{cv.education.year}</span>
                </div>
                <p className="cv-meta">{cv.education.school}</p>
                <p className="cv-text">{cv.education.note}</p>
                <p className="cv-stack">
                  <span>Courses:</span> {cv.courses.join(", ")}
                </p>
              </div>
            </Section>

            <Section title="Languages">
              <ul className="cv-langs">
                {cv.languages.map((l) => (
                  <li key={l.name}>
                    <span className="font-semibold">{l.name}</span>
                    <span>{l.level}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <Section title="References">
            <p className="cv-text">
              {quotes.length} recommendations from managers, clients and colleagues on{" "}
              <a href={profile.links.linkedinRecommendations}>LinkedIn (linkedin.com/in/marufbillah1020)</a>. References available on
              request.
            </p>
          </Section>
        </article>
      </main>
    </div>
  );
}
