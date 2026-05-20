import fs from "fs/promises";
import path from "path";
import { createRequire } from "module";
import { prisma } from "@/lib/prisma";

const require = createRequire(import.meta.url);

type ParsedDocument = {
  text: string;
  pages?: number;
};

type ProcessPdfDocumentParams = {
  documentId: string;
  filePath: string;
  healthInsuranceId: string;
};

type ProcessNormativeBufferParams = {
  documentId: string;
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
  healthInsuranceId: string;
};

type TextPage = {
  pageNumber: number;
  content: string;
};

export function normalizeQuery(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSupportedNormativeFileLabel() {
  return "PDF, DOCX, TXT, MD, CSV o RTF";
}

export function isSupportedNormativeFile(
  fileOrName: File | string,
  mimeType = ""
) {
  const fileName =
    typeof fileOrName === "string"
      ? fileOrName.toLowerCase()
      : fileOrName.name.toLowerCase();

  const normalizedMimeType =
    typeof fileOrName === "string"
      ? mimeType.toLowerCase()
      : (fileOrName.type || "").toLowerCase();

  const supportedExtensions = [
    ".pdf",
    ".docx",
    ".txt",
    ".md",
    ".csv",
    ".rtf",
  ];

  const supportedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/csv",
    "application/rtf",
    "text/rtf",
  ];

  return (
    supportedExtensions.some((extension) => fileName.endsWith(extension)) ||
    supportedMimeTypes.includes(normalizedMimeType)
  );
}

function normalizeTextForStorage(value: string) {
  return value
    .replace(/\r/g, "")
    .replace(/([A-ZÁÉÍÓÚÑ]{3,})\s*\n\s*([A-ZÁÉÍÓÚÑ]{2,})/g, "$1$2")
    .replace(/([a-záéíóúñ])-\s*\n\s*([a-záéíóúñ])/g, "$1$2")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  let pdfParse: (
    buffer: Buffer
  ) => Promise<{ text: string; numpages?: number }>;

  try {
    pdfParse = require("pdf-parse/lib/pdf-parse.js");
  } catch {
    pdfParse = require("pdf-parse");
  }

  const parsed = await pdfParse(buffer);

  return {
    text: parsed.text || "",
    pages: parsed.numpages,
  };
}

async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const mammoth = require("mammoth") as {
      extractRawText: (input: { buffer: Buffer }) => Promise<{ value: string }>;
    };

    const result = await mammoth.extractRawText({ buffer });

    return {
      text: result.value || "",
      pages: 1,
    };
  } catch {
    throw new Error(
      "No se pudo procesar el archivo DOCX. Instalá mammoth con: npm i mammoth"
    );
  }
}

function stripBasicRtf(value: string) {
  return value
    .replace(/\\par[d]?/gi, "\n")
    .replace(/\\'[0-9a-f]{2}/gi, " ")
    .replace(/\\[a-z]+-?\d* ?/gi, "")
    .replace(/[{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function parsePlainText(
  buffer: Buffer,
  extension: string
): Promise<ParsedDocument> {
  const raw = buffer.toString("utf8");

  return {
    text: extension === ".rtf" ? stripBasicRtf(raw) : raw,
    pages: 1,
  };
}

async function extractTextFromBuffer({
  buffer,
  fileName,
  mimeType = "",
}: {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
}): Promise<ParsedDocument> {
  const extension = path.extname(fileName).toLowerCase();
  const normalizedMimeType = mimeType.toLowerCase();

  if (extension === ".pdf" || normalizedMimeType === "application/pdf") {
    return parsePdf(buffer);
  }

  if (
    extension === ".docx" ||
    normalizedMimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return parseDocx(buffer);
  }

  if (extension === ".doc" || normalizedMimeType === "application/msword") {
    throw new Error(
      "El formato DOC antiguo no se puede procesar de forma estable. Abrí el archivo en Word y guardalo como DOCX."
    );
  }

  if (
    [".txt", ".md", ".csv", ".rtf"].includes(extension) ||
    normalizedMimeType.startsWith("text/")
  ) {
    return parsePlainText(buffer, extension);
  }

  throw new Error(
    `Formato no soportado. Podés cargar ${getSupportedNormativeFileLabel()}.`
  );
}

async function extractTextFromFile(filePath: string): Promise<ParsedDocument> {
  const absolutePath = path.join(process.cwd(), filePath);
  const buffer = await fs.readFile(absolutePath);
  const fileName = path.basename(filePath);

  return extractTextFromBuffer({
    buffer,
    fileName,
  });
}

function splitIntoApproxPages(text: string, totalPages?: number) {
  const cleanText = normalizeTextForStorage(text);

  if (!cleanText) return [];

  const pageCount = totalPages && totalPages > 0 ? totalPages : 1;
  const approxLength = Math.ceil(cleanText.length / pageCount);

  const pages: TextPage[] = [];

  for (let index = 0; index < pageCount; index++) {
    const start = index * approxLength;
    const end = start + approxLength;
    const content = cleanText.slice(start, end).trim();

    if (content) {
      pages.push({
        pageNumber: index + 1,
        content,
      });
    }
  }

  return pages.length > 0
    ? pages
    : [
        {
          pageNumber: 1,
          content: cleanText,
        },
      ];
}

function isLikelyHeading(line: string) {
  const cleanLine = line.trim();

  if (cleanLine.length < 4 || cleanLine.length > 140) return false;

  const normalized = normalizeQuery(cleanLine);
  const words = normalized.split(" ").filter(Boolean);

  if (words.length === 0 || words.length > 16) return false;

  const hasLetters = /[a-záéíóúñ]/i.test(cleanLine);

  if (!hasLetters) return false;

  const upperLetters = cleanLine.replace(/[^A-ZÁÉÍÓÚÑ]/g, "").length;
  const lowerLetters = cleanLine.replace(/[^a-záéíóúñ]/g, "").length;
  const upperRatio = upperLetters / Math.max(upperLetters + lowerLetters, 1);

  return (
    cleanLine.endsWith(":") ||
    upperRatio >= 0.72 ||
    /^(requisitos?|documentaci[oó]n|validez|vigencia|cobertura|descuentos?|autorizaci[oó]n|recetario|receta|observaciones?|exclusiones?|planes?|beneficiarios?|medicamentos?|diagn[oó]stico|auditor[ií]a|credencial|afiliado|prescripci[oó]n|documento)/i.test(
      cleanLine
    )
  );
}

function isUselessHeadingOnly(text: string) {
  const normalized = normalizeQuery(text);
  const words = normalized.split(" ").filter(Boolean);

  if (words.length <= 3 && !/\d|%/.test(text)) return true;

  return /^(documentaci|documentacion|documento|descuentos? a cargo|sin cobertura|cobertura|recetario|receta|exclusiones?|validez|vigencia|requisitos?)$/.test(
    normalized
  );
}

function splitBySentencesPreservingMeaning(text: string, maxLength = 1200) {
  const normalized = normalizeTextForStorage(text);

  if (!normalized) return [];

  if (normalized.length <= maxLength) return [normalized];

  const sentences = normalized
    .split(/(?<=[.!?])\s+|\n{2,}/g)
    .map((item) => item.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const next = current ? `${current}\n${sentence}` : sentence;

    if (next.length > maxLength && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = next;
    }
  }

  if (current.trim()) chunks.push(current.trim());

  if (chunks.length > 0) return chunks;

  const fallbackChunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + maxLength, normalized.length);
    const chunk = normalized.slice(start, end).trim();

    if (chunk) fallbackChunks.push(chunk);

    if (end >= normalized.length) break;

    start = Math.max(end - 180, start + 1);
  }

  return fallbackChunks;
}

function splitPageIntoSemanticChunks(content: string) {
  const lines = content
    .replace(/\r/g, "")
    .replace(/([A-ZÁÉÍÓÚÑ]{3,})\s*\n\s*([A-ZÁÉÍÓÚÑ]{2,})/g, "$1$2")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return splitBySentencesPreservingMeaning(content);
  }

  const sections: string[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];

  function flush() {
    const body = currentLines.join("\n").trim();
    const section = [currentTitle, body].filter(Boolean).join("\n").trim();

    if (section && !isUselessHeadingOnly(section)) sections.push(section);

    currentTitle = "";
    currentLines = [];
  }

  for (const line of lines) {
    if (isLikelyHeading(line)) {
      if (currentTitle || currentLines.length > 0) flush();
      currentTitle = line.replace(/:$/, "").trim();
    } else {
      currentLines.push(line);
    }
  }

  flush();

  const expanded: string[] = [];

  for (const section of sections) {
    if (section.length <= 1300) {
      expanded.push(section);
    } else {
      expanded.push(...splitBySentencesPreservingMeaning(section));
    }
  }

  return expanded.filter((chunk) => {
    const normalized = normalizeQuery(chunk);
    return normalized.length > 20 && !isUselessHeadingOnly(chunk);
  });
}

function extractKeywords(content: string) {
  const normalized = normalizeQuery(content);

  const ignoredWords = new Set([
    "para",
    "como",
    "con",
    "por",
    "una",
    "uno",
    "unos",
    "unas",
    "los",
    "las",
    "del",
    "que",
    "de",
    "la",
    "el",
    "en",
    "y",
    "o",
    "a",
    "se",
    "su",
    "sus",
    "al",
    "un",
    "es",
    "son",
    "ser",
    "debe",
    "deben",
    "debera",
    "deberan",
    "documentacion",
    "requisito",
    "requisitos",
    "norma",
    "normas",
    "atencion",
    "beneficiario",
    "beneficiarios",
    "obra",
    "social",
    "obras",
    "sociales",
    "farmacia",
    "farmacias",
  ]);

  const words = normalized
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length >= 4)
    .filter((word) => !ignoredWords.has(word));

  const frequency = new Map<string, number>();

  for (const word of words) {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  }

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word]) => word);
}

async function createPagesAndChunks({
  documentId,
  healthInsuranceId,
  text,
  pagesCount,
}: {
  documentId: string;
  healthInsuranceId: string;
  text: string;
  pagesCount?: number;
}) {
  const extractedText = normalizeTextForStorage(text || "");

  if (!extractedText) {
    throw new Error("No se pudo extraer texto del archivo cargado.");
  }

  await prisma.documentChunk.deleteMany({
    where: {
      documentId,
    },
  });

  await prisma.documentPage.deleteMany({
    where: {
      documentId,
    },
  });

  const pages = splitIntoApproxPages(extractedText, pagesCount);

  let chunksCreated = 0;

  for (const page of pages) {
    const documentPage = await prisma.documentPage.create({
      data: {
        documentId,
        pageNumber: page.pageNumber,
        content: page.content,
      },
    });

    const chunks = splitPageIntoSemanticChunks(page.content);

    for (const chunk of chunks) {
      const normalizedContent = normalizeQuery(chunk);
      const keywords = extractKeywords(chunk);

      if (!normalizedContent) continue;

      await prisma.documentChunk.create({
        data: {
          documentId,
          pageId: documentPage.id,
          healthInsuranceId,
          content: chunk,
          normalizedContent,
          keywords,
          scoreBase: Math.min(keywords.length, 30),
        },
      });

      chunksCreated += 1;
    }
  }

  return {
    pagesCreated: pages.length,
    chunksCreated,
  };
}

export async function processPdfDocument({
  documentId,
  filePath,
  healthInsuranceId,
}: ProcessPdfDocumentParams) {
  const parsed = await extractTextFromFile(filePath);

  return createPagesAndChunks({
    documentId,
    healthInsuranceId,
    text: parsed.text,
    pagesCount: parsed.pages,
  });
}

export async function processNormativeBuffer({
  documentId,
  buffer,
  fileName,
  mimeType,
  healthInsuranceId,
}: ProcessNormativeBufferParams) {
  const parsed = await extractTextFromBuffer({
    buffer,
    fileName,
    mimeType,
  });

  return createPagesAndChunks({
    documentId,
    healthInsuranceId,
    text: parsed.text,
    pagesCount: parsed.pages,
  });
}

export async function processNormativeDocument(
  params: ProcessPdfDocumentParams
) {
  return processPdfDocument(params);
}
