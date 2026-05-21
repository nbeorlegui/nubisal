"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeQuery } from "@/lib/pdf-processor";
import { revalidatePath } from "next/cache";

type SearchSource = {
  documentTitle: string;
  healthInsuranceName: string;
  pageNumber: number | null;
  excerpt: string;
  score: number;
};

export type ChatSearchResponse = {
  answer: string;
  sources: SearchSource[];
};

type ChunkForSearch = {
  id: string;
  documentId: string;
  pageId: string | null;
  healthInsuranceId: string;
  content: string;
  normalizedContent: string;
  keywords: string[];
  scoreBase: number;
  document: {
    title: string;
  };
  page: {
    pageNumber: number;
  } | null;
  healthInsurance: {
    name: string;
    code: string | null;
  };
};

type ScoredChunk = ChunkForSearch & {
  score: number;
  bestExcerpt: string;
  excerptScore: number;
  confidence: "high" | "medium" | "low";
  matchedTerms: string[];
  intent: QuestionIntent;
};

type QuestionIntent =
  | "documentation"
  | "coverage"
  | "validity"
  | "authorization"
  | "quantity"
  | "medication"
  | "general";

const STOP_WORDS = new Set([
  "de",
  "del",
  "la",
  "las",
  "el",
  "los",
  "un",
  "una",
  "unos",
  "unas",
  "y",
  "o",
  "a",
  "en",
  "por",
  "para",
  "con",
  "sin",
  "que",
  "se",
  "al",
  "es",
  "son",
  "como",
  "cual",
  "cuál",
  "cuales",
  "cuáles",
  "cuando",
  "cuándo",
  "cuanto",
  "cuánto",
  "cuantos",
  "cuántos",
  "necesito",
  "quiero",
  "saber",
  "consulta",
  "consultar",
  "obra",
  "social",
  "obras",
  "sociales",
  "normativa",
  "normativas",
  "norma",
  "normas",
  "documento",
  "documentos",
  "farmacia",
  "farmacias",
]);

const SYNONYM_GROUPS = [
  ["validez", "vigencia", "vencimiento", "vence", "vencer", "plazo", "duracion", "dura"],
  ["receta", "recetario", "prescripcion", "prescripto", "prescripta", "indicacion", "orden"],
  ["autorizacion", "autorizar", "auditoria", "validacion", "aprobacion"],
  ["requisito", "requisitos", "documentacion", "documentos", "presentar", "solicita", "pide", "requiere", "necesita"],
  ["cobertura", "cubre", "cubierto", "cubiertos", "descuento", "descuentos", "porcentaje", "cargo"],
  ["medicamento", "medicamentos", "droga", "drogas", "farmaco", "farmacos", "producto", "productos"],
  ["afiliado", "beneficiario", "paciente", "socio"],
  ["cantidad", "cantidades", "unidades", "unidad", "envases", "envase", "tope", "limite"],
];

const INTENT_TERMS: Record<QuestionIntent, string[]> = {
  documentation: [
    "documentacion",
    "documentos",
    "documento",
    "requisitos",
    "requisito",
    "presentar",
    "solicita",
    "pide",
    "requiere",
    "credencial",
    "dni",
    "identidad",
    "recetario",
    "receta",
    "firma",
    "sello",
    "matricula",
    "beneficiario",
    "paciente",
    "afiliado",
  ],
  coverage: [
    "cobertura",
    "cubre",
    "cubierto",
    "descuento",
    "descuentos",
    "porcentaje",
    "cargo",
    "ambulatorio",
    "100",
    "cien",
    "exclusiones",
    "sin cobertura",
    "incluidos",
    "excluidos",
  ],
  validity: [
    "validez",
    "vigencia",
    "vencimiento",
    "vence",
    "plazo",
    "dias",
    "fecha",
    "prescripcion",
  ],
  authorization: [
    "autorizacion",
    "autorizar",
    "auditoria",
    "validacion",
    "aprobacion",
    "telefono",
    "correo",
    "email",
    "orden",
  ],
  quantity: [
    "cantidad",
    "cantidades",
    "unidades",
    "unidad",
    "envases",
    "envase",
    "tope",
    "limite",
  ],
  medication: [
    "medicamento",
    "medicamentos",
    "droga",
    "drogas",
    "farmaco",
    "farmacos",
    "producto",
    "productos",
    "especialidades",
  ],
  general: [],
};

function stemWord(word: string) {
  let value = normalizeQuery(word);

  if (value.length > 8 && value.endsWith("aciones")) {
    value = value.slice(0, -7) + "acion";
  } else if (value.length > 7 && value.endsWith("cion")) {
    value = value.slice(0, -4);
  } else if (value.length > 6 && value.endsWith("es")) {
    value = value.slice(0, -2);
  } else if (value.length > 5 && value.endsWith("s")) {
    value = value.slice(0, -1);
  }

  return value;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getRawWords(value: string) {
  return normalizeQuery(value)
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);
}

function removeHealthInsuranceTerms(
  words: string[],
  healthInsurance?: { name: string; code?: string | null } | null
) {
  if (!healthInsurance) return words;

  const removeSet = new Set([
    ...getRawWords(healthInsurance.name),
    ...getRawWords(healthInsurance.code ?? ""),
  ]);

  return words.filter((word) => !removeSet.has(word));
}

function expandTerms(words: string[]) {
  const baseWords = words
    .map((word) => normalizeQuery(word))
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));

  const expanded: string[] = [];

  for (const word of baseWords) {
    expanded.push(word, stemWord(word));

    for (const group of SYNONYM_GROUPS) {
      const normalizedGroup = group.map(normalizeQuery);

      if (normalizedGroup.includes(word) || normalizedGroup.includes(stemWord(word))) {
        expanded.push(...normalizedGroup);
      }
    }
  }

  return unique(expanded).filter((word) => word.length >= 3);
}

function detectIntent(question: string): QuestionIntent {
  const normalized = normalizeQuery(question);

  const intentScores: Record<QuestionIntent, number> = {
    documentation: 0,
    coverage: 0,
    validity: 0,
    authorization: 0,
    quantity: 0,
    medication: 0,
    general: 0,
  };

  for (const [intent, terms] of Object.entries(INTENT_TERMS) as [QuestionIntent, string[]][]) {
    for (const term of terms) {
      const normalizedTerm = normalizeQuery(term);
      if (normalized.includes(normalizedTerm)) {
        intentScores[intent] += normalizedTerm.length >= 8 ? 3 : 2;
      }
    }
  }

  if (/\b(que|qué)\s+(documentacion|documentos|requisitos?)\b/.test(normalized)) {
    intentScores.documentation += 8;
  }

  if (/\b(que|qué)\s+(cobertura|descuento|porcentaje|cubre)\b/.test(normalized)) {
    intentScores.coverage += 8;
  }

  if (/\b(validez|vigencia|vencimiento|vence|cuanto dura|plazo)\b/.test(normalized)) {
    intentScores.validity += 8;
  }

  const sorted = Object.entries(intentScores)
    .filter(([intent]) => intent !== "general")
    .sort((a, b) => b[1] - a[1]);

  return sorted[0]?.[1] > 0 ? (sorted[0][0] as QuestionIntent) : "general";
}

function termsForIntent(intent: QuestionIntent) {
  return INTENT_TERMS[intent].map(normalizeQuery).filter(Boolean);
}

function hasTokenLike(content: string, term: string) {
  if (!term) return false;

  if (content.includes(term)) return true;

  const stem = stemWord(term);
  if (stem.length >= 4 && content.includes(stem)) return true;

  return false;
}

function getMatchedTerms(content: string, terms: string[]) {
  return terms.filter((term) => hasTokenLike(content, term));
}

function cleanOcrLineBreaks(value: string) {
  return value
    .replace(/\r/g, "")
    .replace(/([A-ZÁÉÍÓÚÑ]{3,})\s*\n\s*([A-ZÁÉÍÓÚÑ]{2,})/g, "$1$2")
    .replace(/([a-záéíóúñ])-\s*\n\s*([a-záéíóúñ])/g, "$1$2")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getLineBlocks(content: string) {
  const cleaned = cleanOcrLineBreaks(content);

  const rawBlocks = cleaned
    .split(/\n{2,}/g)
    .map((block) => block.trim())
    .filter(Boolean);

  if (rawBlocks.length > 1) return rawBlocks;

  const sentences = cleaned
    .split(/(?<=[.!?])\s+|(?=\b[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ ]{4,}:?\b)/g)
    .map((block) => block.trim())
    .filter(Boolean);

  return sentences.length > 0 ? sentences : [cleaned];
}

function isHeadingLike(text: string) {
  const clean = text.trim();
  if (clean.length < 4 || clean.length > 160) return false;

  const upperLetters = clean.replace(/[^A-ZÁÉÍÓÚÑ]/g, "").length;
  const lowerLetters = clean.replace(/[^a-záéíóúñ]/g, "").length;
  const ratio = upperLetters / Math.max(upperLetters + lowerLetters, 1);
  const normalized = normalizeQuery(clean);

  return (
    ratio > 0.65 ||
    clean.endsWith(":") ||
    /^(documentacion|documento|recetario|receta|cobertura|descuentos?|exclusiones?|validez|vigencia|autorizacion|requisitos?)/.test(
      normalized
    )
  );
}

function isUselessShortExcerpt(text: string) {
  const normalized = normalizeQuery(text);

  if (normalized.length === 0) return true;

  const words = normalized.split(" ").filter(Boolean);

  if (normalized.length < 35 && !hasConcreteValue(text)) return true;

  if (words.length <= 3 && !hasConcreteValue(text)) return true;

  if (/^(documentaci|documentacion|documento|descuentos? a cargo|sin cobertura|cobertura|recetario|receta|exclusiones?)$/.test(normalized)) {
    return true;
  }

  return false;
}

function questionExpectsConcreteValue(question: string) {
  const normalized = normalizeQuery(question);

  return /\b(cuanto|cuantos|cuanta|cuantas|dias|dia|mes|meses|ano|años|validez|vigencia|vencimiento|vence|plazo|porcentaje|descuento|cobertura|cantidad|tope|limite)\b/.test(
    normalized
  );
}

function hasConcreteValue(text: string) {
  return /(\b\d+\b|\buno\b|\bdos\b|\btres\b|\bcuatro\b|\bcinco\b|\bdiez\b|\bquince\b|\btreinta\b|\bcuarenta\b|\bcincuenta\b|\bsesenta\b|\bnoventa\b|\b(cien|100)\b|%|por ciento|dias?|mes(?:es)?|años?|horas?|unidades?|envases?)/i.test(
    text
  );
}

function hasContactInfo(text: string) {
  return /(\b\d{4}[- ]?\d{3,}\b|0800|@|correo|email|telefono|teléfono)/i.test(text);
}

function hasDocumentationDetails(text: string) {
  const normalized = normalizeQuery(text);

  const detailTerms = [
    "documento",
    "identidad",
    "dni",
    "cuil",
    "credencial",
    "nombre",
    "apellido",
    "paciente",
    "beneficiario",
    "afiliado",
    "recetario",
    "receta",
    "firma",
    "sello",
    "matricula",
    "diagnostico",
    "fecha",
    "prescripcion",
  ];

  return detailTerms.some((term) => normalized.includes(term));
}

function hasCoverageDetails(text: string) {
  const normalized = normalizeQuery(text);

  return (
    hasConcreteValue(text) ||
    normalized.includes("ambulatorio") ||
    normalized.includes("descuento") ||
    normalized.includes("cargo") ||
    normalized.includes("cobertura") ||
    normalized.includes("exclusiones") ||
    normalized.includes("sin cobertura")
  );
}

function scoreIntentSpecificSignals(text: string, intent: QuestionIntent) {
  const normalized = normalizeQuery(text);
  let score = 0;

  if (intent === "documentation") {
    if (normalized.includes("documentacion")) score += 45;
    if (normalized.includes("documento de identidad")) score += 35;
    if (normalized.includes("recetario")) score += 30;
    if (normalized.includes("firma") || normalized.includes("sello") || normalized.includes("matricula")) score += 25;
    if (hasDocumentationDetails(text)) score += 22;
    if (hasContactInfo(text) && !hasDocumentationDetails(text)) score -= 35;
  }

  if (intent === "coverage") {
    if (normalized.includes("descuentos a cargo")) score += 55;
    if (normalized.includes("ambulatorio")) score += 35;
    if (normalized.includes("100") || normalized.includes("cien por ciento") || normalized.includes("%")) score += 35;
    if (normalized.includes("exclusiones") || normalized.includes("sin cobertura")) score += 10;
    if (hasCoverageDetails(text)) score += 28;
    if (normalized === "descuentos a cargo" || normalized === "sin cobertura") score -= 70;
  }

  if (intent === "validity") {
    if (normalized.includes("validez")) score += 55;
    if (normalized.includes("vigencia")) score += 45;
    if (normalized.includes("fecha de prescripcion")) score += 35;
    if (hasConcreteValue(text)) score += 30;
  }

  if (intent === "authorization") {
    if (normalized.includes("autorizacion")) score += 45;
    if (normalized.includes("auditoria")) score += 30;
    if (hasContactInfo(text)) score += 25;
  }

  return score;
}

function scoreTextAgainstQuestion({
  text,
  questionTerms,
  exactQuestion,
  expectsConcreteValue,
  intent,
}: {
  text: string;
  questionTerms: string[];
  exactQuestion: string;
  expectsConcreteValue: boolean;
  intent: QuestionIntent;
}) {
  const normalized = normalizeQuery(text);
  const intentTerms = termsForIntent(intent);
  const allTerms = unique([...questionTerms, ...intentTerms]);
  const matchedTerms = getMatchedTerms(normalized, allTerms);
  let score = 0;

  score += matchedTerms.length * 10;

  for (const term of matchedTerms) {
    if (term.length >= 7) score += 4;
  }

  if (exactQuestion && normalized.includes(exactQuestion)) {
    score += 80;
  }

  if (isHeadingLike(text) && matchedTerms.length > 0) {
    score += 12;
  }

  if (expectsConcreteValue && hasConcreteValue(text)) {
    score += 22;
  }

  score += scoreIntentSpecificSignals(text, intent);

  if (matchedTerms.length >= 2) {
    const positions = matchedTerms
      .map((term) => normalized.indexOf(term))
      .filter((position) => position >= 0)
      .sort((a, b) => a - b);

    if (positions.length >= 2) {
      const span = positions[positions.length - 1] - positions[0];
      if (span <= 90) score += 35;
      else if (span <= 220) score += 20;
      else if (span <= 500) score += 8;
    }
  }

  if (isUselessShortExcerpt(text)) {
    score -= 120;
  }

  return {
    score,
    matchedTerms,
  };
}

function buildWindowAroundBlock(blocks: string[], index: number) {
  const current = blocks[index] ?? "";
  const previous = index > 0 ? blocks[index - 1] : "";
  const next = index < blocks.length - 1 ? blocks[index + 1] : "";
  const next2 = index < blocks.length - 2 ? blocks[index + 2] : "";

  const windows = [current];

  if (previous && current.length < 700) {
    windows.push(`${previous}\n${current}`.trim());
  }

  if (next && current.length < 900) {
    windows.push(`${current}\n${next}`.trim());
  }

  if (next && next2 && current.length < 500) {
    windows.push(`${current}\n${next}\n${next2}`.trim());
  }

  if (previous && next && current.length < 650) {
    windows.push(`${previous}\n${current}\n${next}`.trim());
  }

  return windows;
}

function extractBestExcerpt(
  content: string,
  questionTerms: string[],
  exactQuestion: string,
  question: string,
  intent: QuestionIntent
) {
  const blocks = getLineBlocks(content);
  const expectsConcreteValue = questionExpectsConcreteValue(question);

  const candidates: { text: string; score: number; matchedTerms: string[] }[] = [];

  for (let index = 0; index < blocks.length; index++) {
    const windows = buildWindowAroundBlock(blocks, index);

    for (const text of windows) {
      const result = scoreTextAgainstQuestion({
        text,
        questionTerms,
        exactQuestion,
        expectsConcreteValue,
        intent,
      });

      candidates.push({
        text,
        score: result.score,
        matchedTerms: result.matchedTerms,
      });
    }
  }

const best = candidates.sort((a, b) => b.score - a.score)[0];
  if (!best || best.score <= 0) {
    const fallback = blocks.find((block) => !isUselessShortExcerpt(block)) ?? content.slice(0, 900);

    return {
      excerpt: fallback.trim(),
      score: 0,
      matchedTerms: [],
    };
  }

  let excerpt = best.text.trim();

  if (excerpt.length > 1100) {
    const normalized = normalizeQuery(excerpt);
    const firstMatch = unique([...questionTerms, ...termsForIntent(intent)])
      .map((term) => normalized.indexOf(term))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0];

    if (typeof firstMatch === "number") {
      const start = Math.max(firstMatch - 220, 0);
      excerpt = excerpt.slice(start, start + 1100).trim();
    } else {
      excerpt = excerpt.slice(0, 1100).trim();
    }
  }

  return {
    excerpt,
    score: best.score,
    matchedTerms: best.matchedTerms,
  };
}

function scoreChunk({
  chunk,
  questionTerms,
  exactQuestion,
  question,
  intent,
}: {
  chunk: ChunkForSearch;
  questionTerms: string[];
  exactQuestion: string;
  question: string;
  intent: QuestionIntent;
}) {
  const normalized = chunk.normalizedContent;
  const intentTerms = termsForIntent(intent);
  const allTerms = unique([...questionTerms, ...intentTerms]);
  const expectsConcreteValue = questionExpectsConcreteValue(question);
  const matchedTerms = getMatchedTerms(normalized, allTerms);
  const keywordMatches = chunk.keywords.filter((keyword) =>
    allTerms.some((term) => keyword.includes(term) || term.includes(keyword))
  );

  let score = 0;
  score += matchedTerms.length * 8;
  score += keywordMatches.length * 7;
  score += Math.min(chunk.scoreBase || 0, 8);
  score += scoreIntentSpecificSignals(chunk.content, intent);

  if (exactQuestion && normalized.includes(exactQuestion)) {
    score += 90;
  }

  if (expectsConcreteValue && hasConcreteValue(chunk.content)) {
    score += 18;
  }

  if (matchedTerms.length >= 2) {
    const positions = matchedTerms
      .map((term) => normalized.indexOf(term))
      .filter((position) => position >= 0)
      .sort((a, b) => a - b);

    if (positions.length >= 2) {
      const span = positions[positions.length - 1] - positions[0];
      if (span <= 120) score += 45;
      else if (span <= 280) score += 28;
      else if (span <= 650) score += 10;
    }
  }

  const bestExcerpt = extractBestExcerpt(
    chunk.content,
    questionTerms,
    exactQuestion,
    question,
    intent
  );

  score += Math.min(bestExcerpt.score, 95);

  if (isUselessShortExcerpt(bestExcerpt.excerpt)) {
    score -= 150;
  }

  let confidence: ScoredChunk["confidence"] = "low";
  if (score >= 110 && bestExcerpt.score >= 45) confidence = "high";
  else if (score >= 55 && bestExcerpt.score >= 20) confidence = "medium";

  return {
    score,
    bestExcerpt: bestExcerpt.excerpt,
    excerptScore: bestExcerpt.score,
    confidence,
    matchedTerms: bestExcerpt.matchedTerms,
    intent,
  };
}

async function detectHealthInsurance(question: string) {
  const normalizedQuestion = normalizeQuery(question);

  const healthInsurances = await prisma.healthInsurance.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      code: true,
    },
  });

  let bestMatch: {
    id: string;
    name: string;
    code: string | null;
    score: number;
  } | null = null;

  for (const item of healthInsurances) {
    const normalizedName = normalizeQuery(item.name);
    const normalizedCode = normalizeQuery(item.code ?? "");

    let score = 0;

    if (normalizedName && normalizedQuestion.includes(normalizedName)) {
      score += 70;
    }

    if (normalizedCode && normalizedQuestion.includes(normalizedCode)) {
      score += 80;
    }

    const nameWords = normalizedName.split(" ").filter(Boolean);

    for (const word of nameWords) {
      if (word.length >= 3 && normalizedQuestion.includes(word)) {
        score += 15;
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = {
        id: item.id,
        name: item.name,
        code: item.code,
        score,
      };
    }
  }

  return bestMatch;
}

function buildAnswer(scoredChunks: ScoredChunk[], detectedHealthInsurance?: { name: string } | null) {
  const usefulChunks = scoredChunks.filter((chunk: ScoredChunk) => !isUselessShortExcerpt(chunk.bestExcerpt));
  const best = usefulChunks[0] ?? scoredChunks[0];

  if (!best) {
    const scope = detectedHealthInsurance ? ` para ${detectedHealthInsurance.name}` : "";

    return `No encontré información suficiente${scope} en las normativas cargadas. Probá reformular la consulta o verificá que la normativa correspondiente esté cargada y activa.`;
  }

  const sourceLine = `Fuente: ${best.document.title}${best.page?.pageNumber ? `, página ${best.page.pageNumber}` : ""}.`;
  const heading = `Según la normativa de ${best.healthInsurance.name}:`;

  const alternatives = usefulChunks
    .slice(1)
    .filter((chunk) => {
      const closeScore = chunk.score >= best.score * 0.72;
      const differentText = normalizeQuery(chunk.bestExcerpt) !== normalizeQuery(best.bestExcerpt);
      return closeScore && differentText;
    })
    .slice(0, 2);

  if (best.confidence === "low") {
    return `${heading}\n\nEncontré una coincidencia posible, pero no es concluyente. Revisá este fragmento:\n\n${best.bestExcerpt}\n\n${sourceLine}`;
  }

  if (alternatives.length === 0) {
    return `${heading}\n\n${best.bestExcerpt}\n\n${sourceLine}`;
  }

  const alternativeText = alternatives
    .map((item, index) => {
      const alternativeSource = `${item.document.title}${item.page?.pageNumber ? `, página ${item.page.pageNumber}` : ""}`;
      return `${index + 1}. ${item.bestExcerpt}\nFuente: ${alternativeSource}.`;
    })
    .join("\n\n");

  return `${heading}\n\n${best.bestExcerpt}\n\n${sourceLine}\n\nTambién encontré otras coincidencias posibles. Si no te referías a lo anterior, puede ser esto:\n\n${alternativeText}`;
}

export async function searchNormativeAction(
  question: string
): Promise<ChatSearchResponse> {
  const user = await requireUser();
  const cleanQuestion = question.trim();

  if (!cleanQuestion) {
    return {
      answer: "Escribí una consulta para buscar en las normativas cargadas.",
      sources: [],
    };
  }

  const detectedHealthInsurance = await detectHealthInsurance(cleanQuestion);
  const normalizedQuestion = normalizeQuery(cleanQuestion);
  const rawWordsWithoutHealthInsurance = removeHealthInsuranceTerms(
    getRawWords(cleanQuestion),
    detectedHealthInsurance
  );
  const questionTerms = expandTerms(rawWordsWithoutHealthInsurance);
  const intent = detectIntent(cleanQuestion);
  const exactQuestion = normalizeQuery(rawWordsWithoutHealthInsurance.join(" "));

  const query = await prisma.query.create({
    data: {
      originalText: cleanQuestion,
      normalizedText: normalizedQuestion,
      userId: user.id,
      branchId: user.branchId ?? null,
      detectedHealthInsuranceId: detectedHealthInsurance?.id ?? null,
    },
  });

  if (questionTerms.length === 0 && intent === "general") {
    revalidatePath("/admin/dashboard");

    return {
      answer:
        "Necesito una consulta un poco más específica para buscar en las normativas. Por ejemplo: validez de receta, requisitos de autorización, cobertura, documentación solicitada, etc.",
      sources: [],
    };
  }

  const chunks = await prisma.documentChunk.findMany({
    where: {
      healthInsuranceId: detectedHealthInsurance?.id ?? undefined,
      document: {
        isActive: true,
      },
      healthInsurance: {
        isActive: true,
      },
    },
    select: {
      id: true,
      documentId: true,
      pageId: true,
      healthInsuranceId: true,
      content: true,
      normalizedContent: true,
      keywords: true,
      scoreBase: true,
      document: {
        select: {
          title: true,
        },
      },
      page: {
        select: {
          pageNumber: true,
        },
      },
      healthInsurance: {
        select: {
          name: true,
          code: true,
        },
      },
    },
    take: 2500,
  });

  const scoredChunks: ScoredChunk[] = chunks
    .map((chunk: any) => {
      const normalizedChunk: ChunkForSearch = {
        ...chunk,
        keywords: Array.isArray(chunk.keywords) ? chunk.keywords.map(String) : [],
      };

      const result = scoreChunk({
        chunk: normalizedChunk,
        questionTerms,
        exactQuestion,
        question: cleanQuestion,
        intent,
      });

      return {
        ...normalizedChunk,
        ...result,
      };
    })
    .filter((chunk: ScoredChunk) => chunk.score > 0)
    .filter((chunk: ScoredChunk) => !isUselessShortExcerpt(chunk.bestExcerpt) || chunk.score >= 120)
    .sort((a: ScoredChunk, b: ScoredChunk) => b.score - a.score)
    .slice(0, 8);

  if (scoredChunks.length === 0) {
    revalidatePath("/admin/dashboard");

    const scope = detectedHealthInsurance ? ` para ${detectedHealthInsurance.name}` : "";

    return {
      answer: `No encontré información suficiente${scope} en las normativas cargadas. Probá reformular la consulta o verificá que la normativa correspondiente esté cargada y activa.`,
      sources: [],
    };
  }

  const sources: SearchSource[] = scoredChunks.slice(0, 4).map((chunk: ScoredChunk) => ({
    documentTitle: chunk.document.title,
    healthInsuranceName: chunk.healthInsurance.name,
    pageNumber: chunk.page?.pageNumber ?? null,
    excerpt: chunk.bestExcerpt,
    score: chunk.score,
  }));

  await prisma.queryResult.createMany({
    data: scoredChunks.slice(0, 6).map((chunk: ScoredChunk) => ({
      queryId: query.id,
      documentId: chunk.documentId,
      chunkId: chunk.id,
      score: chunk.score,
      excerpt: chunk.bestExcerpt,
    })),
  });

  await prisma.query.update({
    where: {
      id: query.id,
    },
    data: {
      resultFound: scoredChunks.length > 0,
      topScore: scoredChunks[0]?.score ?? 0,
    },
  });

  const answer = buildAnswer(scoredChunks, detectedHealthInsurance);

  revalidatePath("/admin/dashboard");

  return {
    answer,
    sources,
  };
}
