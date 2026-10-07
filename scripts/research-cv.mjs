// About's research-related CV entries come from the Research records.
// The biography and unrelated CV sections remain independently editable.
const escape = value => String(value ?? "").replace(/[\\[\]*_]/g, "\\$&");
const link = (text, url) => url ? `[${escape(text)}](${url})` : escape(text);

export function researchCV(cv, research) {
  const publications = (research.publications ?? []).map(item => ({
    years: String(item.year),
    text: `${escape(item.authors)}. “${link(item.title, item.url ?? item.pdf)}.” ${escape(item.venue)}.`,
    note: [item.kind, item.detail, item.language].filter(Boolean).map(escape).join(" · "),
  }));
  const teaching = (research.teaching ?? []).map(item => ({
    years: item.dates ?? String(item.year),
    text: `${escape(item.role)}, “${escape(item.course)}”, ${item.programme ? `${escape(item.programme)}, ` : ""}${link(item.institution, item.url)}`,
  }));
  const conferences = (research.conferences ?? []).map(item => ({
    years: item.date ?? String(item.year),
    text: `${link(item.title, item.pdf)}. ${escape(item.venue)}${item.organizer ? ` · ${escape(item.organizer)}` : ""}.`,
    note: [item.role, item.work, item.note].filter(Boolean).map(escape).join(" · "),
  }));
  const sections = [];
  for (const section of cv) {
    const entries = section.research_source === "publications" ? publications : (section.entries ?? []).flatMap(entry => entry.research_source === "teaching" ? teaching : [{ ...entry }]);
    sections.push({ ...section, entries });
    if (section.research_source === "publications" && conferences.length) {
      sections.push({ title: "Conferences", entries: conferences });
    }
  }
  return sections;
}
