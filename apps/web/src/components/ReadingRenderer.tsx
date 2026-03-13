/**
 * Renders a Vyberology reading with proper table formatting.
 * Parses markdown pipe-tables into styled HTML tables,
 * and renders all other lines as formatted text.
 */

interface ReadingRendererProps {
  text: string;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

function parseTableBlock(lines: string[]): TableData | null {
  if (lines.length < 2) return null;

  const parseLine = (line: string) =>
    line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

  const headers = parseLine(lines[0]);
  if (headers.length === 0) return null;

  // Skip separator row (|---|---|...)
  const startIdx = lines[1].match(/^\|?\s*[-:]+/) ? 2 : 1;

  const rows: string[][] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    if (cells.length > 0) rows.push(cells);
  }

  return rows.length > 0 ? { headers, rows } : null;
}

function RenderedTable({ table }: { table: TableData }) {
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-vy-charcoal/[0.08]">
      <table className="w-full text-left font-sans text-sm">
        <thead>
          <tr className="border-b border-vy-charcoal/[0.10] bg-vy-charcoal/[0.03]">
            {table.headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-2.5 font-semibold text-vy-charcoal/80 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-vy-charcoal/[0.05] last:border-b-0"
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-4 py-2.5 text-vy-charcoal/75 ${ci === 0 ? "font-medium text-vy-charcoal/90 whitespace-nowrap" : ""}`}
                >
                  {cell}
                </td>
              ))}
              {/* Fill empty cells if row is shorter than headers */}
              {Array.from({ length: Math.max(0, table.headers.length - row.length) }).map((_, i) => (
                <td key={`empty-${i}`} className="px-4 py-2.5" />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReadingRenderer({ text }: ReadingRendererProps) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect start of a markdown table (line contains | and next line is separator or also has |)
    if (line.includes("|") && line.trim().startsWith("|")) {
      // Collect consecutive table lines
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }

      const table = parseTableBlock(tableLines);
      if (table) {
        elements.push(<RenderedTable key={`table-${i}`} table={table} />);
      } else {
        // Couldn't parse as table, render as text
        tableLines.forEach((tl, ti) => {
          elements.push(
            <span key={`tl-${i}-${ti}`}>
              {tl}
              {"\n"}
            </span>
          );
        });
      }
      continue;
    }

    // Section dividers (⸻)
    if (line.trim() === "⸻") {
      elements.push(
        <div key={`div-${i}`} className="my-6 h-px bg-vy-charcoal/[0.08]" />
      );
      i++;
      continue;
    }

    // Section headers with emoji (🌍, 🔢, 💠, etc.)
    const emojiHeaderMatch = line.match(/^([\u{1F300}-\u{1FFFF}]|[\u2600-\u27BF]|[\u2700-\u27BF]|[\u{1F900}-\u{1F9FF}]|✨|✴️|⸻)\s*(.+)/u);
    if (emojiHeaderMatch) {
      elements.push(
        <h3 key={`h-${i}`} className="font-display text-lg font-semibold text-vy-charcoal mt-2 mb-1">
          {line}
        </h3>
      );
      i++;
      continue;
    }

    // "Main Frequency:" and "Core Theme:" lines
    if (line.trim().startsWith("Main Frequency:") || line.trim().startsWith("Core Theme:")) {
      elements.push(
        <p key={`meta-${i}`} className="font-sans text-sm font-medium text-vy-gold/90 my-1">
          {line}
        </p>
      );
      i++;
      continue;
    }

    // "Theme:" line
    if (line.trim().startsWith("Theme:")) {
      elements.push(
        <p key={`theme-${i}`} className="font-sans text-base font-medium text-vy-charcoal/85 italic mb-1">
          {line}
        </p>
      );
      i++;
      continue;
    }

    // "Area:" line
    if (line.trim().startsWith("Area:")) {
      elements.push(
        <p key={`area-${i}`} className="font-sans text-sm font-semibold text-vy-charcoal/80 mb-1">
          {line}
        </p>
      );
      i++;
      continue;
    }

    // Quoted essence lines
    if (line.trim().startsWith('"') && line.trim().endsWith('"')) {
      elements.push(
        <blockquote key={`q-${i}`} className="font-display text-base italic text-vy-charcoal/80 border-l-2 border-vy-gold/40 pl-4 my-3">
          {line.trim()}
        </blockquote>
      );
      i++;
      continue;
    }

    // Empty lines
    if (line.trim() === "") {
      elements.push(<div key={`sp-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // Default text
    elements.push(
      <p key={`p-${i}`} className="font-sans text-base leading-relaxed text-vy-charcoal/85 my-0.5">
        {line}
      </p>
    );
    i++;
  }

  return <div>{elements}</div>;
}
