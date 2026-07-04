// netlify/functions/carrusel-diario.mjs
//
// Esta función corre SOLA todos los días (ver el "schedule" abajo).
// 1. Le pide a Claude que busque noticias de agua en PR y genere el carrusel.
// 2. Escribe el resultado como una fila nueva en tu Google Sheet.
//
// No requiere que abras nada. Solo revisa el Sheet cuando quieras ver el contenido del día.

import { google } from "googleapis";

// ---------- CONFIG ----------
const ANTHROPIC_MODEL = "claude-sonnet-5";
const SHEET_TAB_NAME = "Carruseles"; // nombre de la pestaña dentro de tu Google Sheet

const SYSTEM_PROMPT = `Eres un estratega de contenido y copywriter para Instagram, especializado en agua potable, salud y ventas consultivas en Puerto Rico. Trabajas para Ambitious Corp (Water Logistics), vendiendo Cebilon (ósmosis inversa/alcalina, origen turco, certificaciones NSF/ANSI, WQA, Institut Fresenius, Red Dot Award, German Design Award, garantía de por vida) y Master Pro (suavizador de agua).

Tu tarea diaria:
1. Busca noticias/datos recientes (últimas 24-72h si existen) sobre calidad de agua en Puerto Rico, microplásticos, contaminantes emergentes (PFAS, metales), o estudios científicos relevantes. Prioriza fuentes serias (EPA, AAA, estudios, El Nuevo Día, Primera Hora, Metro PR).
2. Elige UN ángulo del día, el más impactante para un consumidor puertorriqueño común.
3. Decide si conecta mejor con Cebilon (contaminación, sabor, salud, microplásticos, metales) o Master Pro (dureza del agua, sarro, manchas, daño a electrodomésticos/tuberías).
4. Crea un carrusel de 8 slides (gancho, problema x2, por qué te afecta, solución x2, prueba social, CTA). Máximo 30 palabras por slide.
5. Escribe un caption con hook, storytelling breve, CTA (WhatsApp 939-400-7075 o IG @riveraambitious.pr), y 8-12 hashtags.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin backticks, con esta forma exacta:
{
  "fecha": "YYYY-MM-DD",
  "angulo": "string",
  "producto": "Cebilon o Master Pro",
  "fuente": "string (URL o referencia)",
  "slide_1": "string",
  "slide_2": "string",
  "slide_3": "string",
  "slide_4": "string",
  "slide_5": "string",
  "slide_6": "string",
  "slide_7": "string",
  "slide_8": "string",
  "caption": "string",
  "hashtags": "string"
}`;

// ---------- HELPERS ----------

async function generarCarrusel() {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Genera el carrusel de hoy, ${new Date().toISOString().split("T")[0]}. No repitas ángulos usados en los últimos días si puedes evitarlo.`,
        },
      ],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${errText}`);
  }

  const data = await response.json();

  const textBlocks = data.content.filter((b) => b.type === "text");
  const rawText = textBlocks.map((b) => b.text).join("\n").trim();

  const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  return JSON.parse(cleaned);
}

async function escribirEnGoogleSheet(carrusel) {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64, "base64").toString("utf-8")
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const row = [
    carrusel.fecha,
    carrusel.angulo,
    carrusel.producto,
    carrusel.fuente,
    carrusel.slide_1,
    carrusel.slide_2,
    carrusel.slide_3,
    carrusel.slide_4,
    carrusel.slide_5,
    carrusel.slide_6,
    carrusel.slide_7,
    carrusel.slide_8,
    carrusel.caption,
    carrusel.hashtags,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_TAB_NAME}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

// ---------- HANDLER ----------

export default async () => {
  try {
    const carrusel = await generarCarrusel();
    await escribirEnGoogleSheet(carrusel);
    console.log("Carrusel del día generado y guardado:", carrusel.fecha);
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Error generando el carrusel diario:", err);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
};

// Corre todos los días a las 10:00 UTC = 6:00 AM hora de Puerto Rico (AST, sin horario de verano)
export const config = {
  schedule: "0 10 * * *",
};
