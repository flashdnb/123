import { load } from "cheerio";
import { createTextStreamResponse, streamText } from "ai";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isApiKeyMissing, models } from "@/lib/ai";

const MAX_INPUT_CHARS = 15000;
const FETCH_TIMEOUT_MS = 10000;
const FETCH_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

const UNREADABLE_URL_ERROR =
  "Не удалось прочитать содержимое по этой ссылке. Попробуйте скопировать текст напрямую.";

const requestSchema = z.object({
  input: z.string().trim().min(1, "Пустой ввод"),
  type: z.enum(["url", "text"]),
  quality: z.enum(["fast", "quality"]),
});

const SYSTEM_PROMPT = `Ты — эксперт по анализу информации. Твоя единственная задача — проанализировать предоставленный текст и выдать результат СТРОГО в следующем формате, без каких-либо вступлений, приветствий или заключений.

1️⃣ **Главная мысль**
(Одно-два предложения. О чем это на самом деле? Самая суть.)

2️⃣ **Ключевые факты и цифры**
(3-4 маркированных пункта с самой важной конкретикой: имена, даты, суммы, названия).

3️⃣ **Что с этим делать (Action Items)**
(2-3 практических вывода или следующих шага для читателя).

ЖЕСТКИЕ ПРАВИЛА:
- Пиши исключительно на русском языке.
- Будь предельно лаконичен. Никакой "воды" и общих фраз.
- ЗАПРЕЩЕНО начинать с фраз типа "Вот ваше резюме", "Конечно", "Я проанализировал текст". Начинай ответ НЕМЕДЛЕННО с "1️⃣".
- Если текст бессмысленный или слишком короткий, так и напиши в пункте 1: "Текст не содержит полезной информации для анализа".
- Сохраняй форматирование Markdown (жирный шрифт, списки).`;

function truncate(text: string, max = MAX_INPUT_CHARS) {
  return text.length > max ? text.slice(0, max) : text;
}

/**
 * article/main define the content scope; p/h1/h2/h3 are the text-bearing
 * leaves inside it. Collecting both levels via one selector would double
 * count paragraph text nested inside <article>/<main>.
 */
function extractTextFromHtml(html: string): string {
  const $ = load(html);
  $("script, style, noscript, nav, footer, header, aside, svg, iframe, form").remove();

  const scope = $("article, main").first();
  const root = scope.length > 0 ? scope : $("body");

  const parts: string[] = [];
  root.find("h1, h2, h3, p").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text) parts.push(text);
  });

  return parts.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function fetchAndExtract(url: string): Promise<string | null> {
  let html: string;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": FETCH_USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    html = await response.text();
  } catch {
    return null;
  }

  const extracted = extractTextFromHtml(html);
  return extracted.length >= 50 ? extracted : null;
}

export async function POST(request: NextRequest) {
  if (isApiKeyMissing()) {
    return NextResponse.json(
      { error: "Ошибка конфигурации: отсутствует API ключ Anthropic" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Некорректное тело запроса." },
      { status: 400 }
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные запроса." },
      { status: 400 }
    );
  }

  const { input, type, quality } = parsed.data;
  let content: string;

  if (type === "url") {
    const urlCheck = z.string().url().safeParse(input);
    if (!urlCheck.success) {
      return NextResponse.json({ error: UNREADABLE_URL_ERROR }, { status: 400 });
    }

    const extracted = await fetchAndExtract(input);
    if (!extracted) {
      return NextResponse.json({ error: UNREADABLE_URL_ERROR }, { status: 400 });
    }
    content = truncate(extracted);
  } else {
    content = truncate(input);
  }

  const model = quality === "quality" ? models.quality : models.fast;

  try {
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      prompt: content,
      onError: ({ error }) => {
        console.error("[api/summarize] streamText error:", error);
      },
    });

    return createTextStreamResponse({ stream: result.textStream });
  } catch {
    return NextResponse.json(
      { error: "Не удалось получить ответ от модели. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
