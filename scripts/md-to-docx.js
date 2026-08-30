// Regenera "descripcion del sistema.docx" a partir de
// docs/descripcion-del-sistema.md — ese .md es la fuente de verdad; este
// script solo lo convierte a .docx para quien prefiera leerlo en Word.
//
// Uso: node scripts/md-to-docx.js
//
// Soporta un subconjunto de Markdown suficiente para este documento:
// encabezados (#/##/###), listas con guiones y numeradas (con líneas de
// continuación indentadas), tablas, citas (>), bloques de código, texto en
// **negrita**, `code` y *cursiva*, y junta líneas envueltas de un mismo
// párrafo/ítem en un solo párrafo de Word (igual que un renderer de
// Markdown normal).

const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} = require("docx");

const SRC = path.join(__dirname, "..", "docs", "descripcion-del-sistema.md");
const OUT = path.join(__dirname, "..", "descripcion del sistema.docx");

function parseInline(text, baseItalics = false) {
  const runs = [];
  const re = /(\*\*(.+?)\*\*|`(.+?)`|\*(.+?)\*)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) {
      runs.push(new TextRun({ text: text.slice(last, m.index), italics: baseItalics }));
    }
    if (m[2] !== undefined) {
      runs.push(new TextRun({ text: m[2], bold: true, italics: baseItalics }));
    } else if (m[3] !== undefined) {
      runs.push(new TextRun({ text: m[3], font: "Consolas", italics: baseItalics }));
    } else if (m[4] !== undefined) {
      runs.push(new TextRun({ text: m[4], italics: true }));
    }
    last = re.lastIndex;
  }
  if (last < text.length) {
    runs.push(new TextRun({ text: text.slice(last), italics: baseItalics }));
  }
  if (runs.length === 0) runs.push(new TextRun({ text: "" }));
  return runs;
}

function isSpecialLine(l) {
  return (
    l === "" ||
    l === "---" ||
    l.startsWith("```") ||
    l.startsWith("|") ||
    l.startsWith(">") ||
    /^#{1,3}\s+/.test(l) ||
    /^[-*]\s+/.test(l) ||
    /^\d+\.\s+/.test(l)
  );
}

function main() {
  const md = fs.readFileSync(SRC, "utf-8");
  const lines = md.split(/\r?\n/);

  // Junta líneas de continuación indentadas (envoltura de un mismo ítem de
  // lista) empezando en lines[idx].
  function collectContinuation(idx) {
    let extra = "";
    while (idx < lines.length) {
      const raw = lines[idx];
      const trimmed = raw.trim();
      if (raw.startsWith("  ") && trimmed !== "" && !isSpecialLine(trimmed)) {
        extra += " " + trimmed;
        idx++;
      } else {
        break;
      }
    }
    return { extra, next: idx };
  }

  const children = [];
  let i = 0;

  function pushSpacer() {
    children.push(new Paragraph({ text: "", spacing: { after: 60 } }));
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line === "") {
      i++;
      continue;
    }

    if (line === "---") {
      children.push(
        new Paragraph({
          text: "",
          border: { bottom: { color: "AAAAAA", space: 1, style: BorderStyle.SINGLE, size: 6 } },
          spacing: { after: 200 },
        }),
      );
      i++;
      continue;
    }

    if (line.startsWith("```")) {
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      codeLines.forEach((cl) => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: cl || " ", font: "Consolas", size: 20 })],
            shading: { fill: "F1F1F7" },
            spacing: { after: 20 },
          }),
        );
      });
      pushSpacer();
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const rows = tableLines.filter((l) => !/^\|[\s:|-]+\|$/.test(l));
      const cellsOf = (l) => l.split("|").slice(1, -1).map((c) => c.trim());

      const tableRows = rows.map((rowLine, rowIdx) => {
        const cells = cellsOf(rowLine);
        return new TableRow({
          tableHeader: rowIdx === 0,
          children: cells.map(
            (cellText) =>
              new TableCell({
                width: { size: Math.floor(100 / cells.length), type: WidthType.PERCENTAGE },
                shading: rowIdx === 0 ? { fill: "EEECFE" } : undefined,
                children: [new Paragraph({ children: parseInline(cellText) })],
              }),
          ),
        });
      });

      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }));
      pushSpacer();
      continue;
    }

    if (line.startsWith(">")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      children.push(
        new Paragraph({
          children: parseInline(quoteLines.join(" "), true),
          indent: { left: 360 },
          border: { left: { color: "5B4CF0", space: 8, style: BorderStyle.SINGLE, size: 18 } },
          spacing: { after: 200 },
        }),
      );
      continue;
    }

    let hm;
    if ((hm = /^#\s+(.*)$/.exec(line))) {
      children.push(
        new Paragraph({
          children: parseInline(hm[1]),
          heading: HeadingLevel.TITLE,
          spacing: { before: 200, after: 120 },
        }),
      );
      i++;
      continue;
    }
    if ((hm = /^##\s+(.*)$/.exec(line))) {
      children.push(
        new Paragraph({
          children: parseInline(hm[1]),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 260, after: 120 },
        }),
      );
      i++;
      continue;
    }
    if ((hm = /^###\s+(.*)$/.exec(line))) {
      children.push(
        new Paragraph({
          children: parseInline(hm[1]),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
      );
      i++;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const { extra, next } = collectContinuation(i + 1);
      children.push(
        new Paragraph({
          children: parseInline(line.replace(/^[-*]\s+/, "") + extra),
          bullet: { level: 0 },
          spacing: { after: 40 },
        }),
      );
      i = next;
      continue;
    }

    let nm;
    if ((nm = /^(\d+)\.\s+(.*)$/.exec(line))) {
      const { extra, next } = collectContinuation(i + 1);
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${nm[1]}. `, bold: true }), ...parseInline(nm[2] + extra)],
          indent: { left: 360 },
          spacing: { after: 40 },
        }),
      );
      i = next;
      continue;
    }

    // Párrafo normal: junta líneas envueltas hasta la siguiente línea
    // especial o en blanco, como un renderer de Markdown normal.
    const paraLines = [line];
    i++;
    while (i < lines.length && !isSpecialLine(lines[i].trim())) {
      paraLines.push(lines[i].trim());
      i++;
    }
    children.push(
      new Paragraph({ children: parseInline(paraLines.join(" ")), spacing: { after: 120 } }),
    );
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ properties: {}, children }],
  });

  Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(OUT, buffer);
    console.log("Escrito:", OUT, buffer.length, "bytes");
  });
}

main();
