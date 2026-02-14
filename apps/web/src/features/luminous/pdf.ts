import { orders, storyBlocks } from "./data";
import { LuminousUserInfo, QuizResult, ResolvedBook } from "./types";

const escapePdfText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const createTextLines = (heading: string, body: string | string[]) => {
  const contentLines: string[] = [heading];
  if (Array.isArray(body)) {
    contentLines.push(...body);
  } else {
    contentLines.push(body);
  }
  return contentLines;
};

const buildContentStream = (lines: string[]) => {
  const renderedLines = lines.flatMap((line, index) => {
    if (index === 0) {
      return ["/F1 20 Tf", "72 720 Td", `(${escapePdfText(line)}) Tj`];
    }
    return ["0 -22 Td", `(${escapePdfText(line)}) Tj`];
  });

  return ["BT", ...renderedLines, "ET"].join("\n");
};

interface PdfSection {
  heading: string;
  body: string | string[];
}

const buildSections = (
  user: LuminousUserInfo,
  result: QuizResult,
  edition = "Book of Light"
): PdfSection[] => {
  const order = orders[result.finalOrder];
  return [
    { heading: "Luminous Legends", body: `${user.name}'s Legend Book` },
    { heading: "Edition", body: edition },
    { heading: "Order of Light", body: `${order.name} — Lumenheart: ${order.defaultLumenheart}` },
    {
      heading: "Light Traits",
      body: order.lightTraits.map((trait, idx) => `${idx + 1}. ${trait}`),
    },
    {
      heading: "Veil Traits",
      body: order.veilTraits.map((trait, idx) => `${idx + 1}. ${trait}`),
    },
    { heading: "Signature Ability", body: storyBlocks.signatureAbility[order.signatureAbilityId] },
    { heading: "Origin", body: storyBlocks.origin[order.originBlockId] },
    { heading: "Trial", body: storyBlocks.trial[order.trialBlockId] },
    { heading: "Destiny", body: storyBlocks.destiny[order.destinyBlockId] },
    { heading: "Closing", body: storyBlocks.closings[edition] },
    user.dedication
      ? { heading: "Dedication", body: user.dedication }
      : { heading: "Email", body: user.email },
  ];
};

const buildResolvedSections = (
  book: ResolvedBook,
  user: LuminousUserInfo,
  result: QuizResult,
  edition = "Book of Light"
): PdfSection[] => {
  const primaryOrder = orders[result.finalOrder];
  const sections: PdfSection[] = [
    { heading: book.title, body: `${user.name}'s personalised legend (${edition})` },
    { heading: "Order of Light", body: `${primaryOrder.name} — ${primaryOrder.tagline}` },
  ];

  book.sections.forEach((section) => {
    section.blocks.forEach((block, index) => {
      const heading = index === 0 ? section.title : `${section.title} (${block.id})`;
      const body = block.type === "list" ? block.value.split("\n") : block.value;
      sections.push({ heading, body });
    });
  });

  return sections;
};

const assemblePdf = (sections: PdfSection[]) => {
  const prefix = "%PDF-1.4\n";
  const objects: string[] = [];

  // 1: Catalog (points to /Pages at 2)
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  // 2: Pages (placeholder for now, replaced after pages are built)
  objects.push("");

  // 3: Font
  objects.push(`3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);

  const pageIds: number[] = [];
  let nextId = 4;
  const textEncoder = new TextEncoder();

  sections.forEach((section) => {
    const lines = createTextLines(section.heading, section.body);
    const contentStream = buildContentStream(lines);
    const contentLength = textEncoder.encode(contentStream).length;
    const contentId = nextId;
    const pageId = nextId + 1;

    const contentObject = `${contentId} 0 obj\n<< /Length ${contentLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`;
    const pageObject = `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj\n`;

    objects.push(contentObject);
    objects.push(pageObject);
    pageIds.push(pageId);
    nextId += 2;
  });

  // Build Pages object once page IDs are known
  objects[1] = `2 0 obj\n<< /Type /Pages /Kids [${pageIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] /Count ${pageIds.length} >>\nendobj\n`;

  // Calculate offsets for xref table
  const offsets: number[] = [0];
  let position = prefix.length;
  objects.forEach((obj) => {
    offsets.push(position);
    position += obj.length;
  });

  const xrefStart = position;
  const xrefEntries = offsets
    .map((offset, index) => `${offset.toString().padStart(10, "0")} 00000 ${index === 0 ? "f" : "n"} \n`)
    .join("");

  const xref = `xref\n0 ${objects.length + 1}\n${xrefEntries}trailer\n<< /Size ${
    objects.length + 1
  } /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const pdfString = prefix + objects.join("") + xref;
  return new Blob([pdfString], { type: "application/pdf" });
};

export const generateLegendBook = (
  user: LuminousUserInfo,
  result: QuizResult,
  edition?: string
) => {
  const sections = buildSections(user, result, edition);
  return assemblePdf(sections);
};

export const generateResolvedLegendBook = (
  user: LuminousUserInfo,
  result: QuizResult,
  book: ResolvedBook,
  edition?: string
) => {
  const sections = buildResolvedSections(book, user, result, edition);
  return assemblePdf(sections);
};
