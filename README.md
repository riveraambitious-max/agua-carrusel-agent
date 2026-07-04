# Agente Diario de Carruseles — Agua PR

Este proyecto genera automáticamente, todos los días a las 6:00 AM (hora PR), un carrusel de Instagram
sobre calidad de agua en Puerto Rico, y lo escribe como una fila nueva en un Google Sheet tuyo.

No necesitas abrir nada. El Sheet se llena solo cada mañana.

---

## Paso 1 — Crea el Google Sheet

1. Crea un Google Sheet nuevo (vacío).
2. Ponle una pestaña llamada exactamente `Carruseles`.
3. En la fila 1, pon estos encabezados (opcional pero recomendado):

```
Fecha | Ángulo | Producto | Fuente | Slide 1 | Slide 2 | Slide 3 | Slide 4 | Slide 5 | Slide 6 | Slide 7 | Slide 8 | Caption | Hashtags
```

4. Copia el ID del Sheet — está en la URL:
   `https://docs.google.com/spreadsheets/d/ESTE-ES-EL-ID/edit`

---

## Paso 2 — Crea una cuenta de servicio de Google (para que la función pueda escribir en el Sheet)

1. Ve a https://console.cloud.google.com/
2. Crea un proyecto nuevo (o usa uno existente).
3. Ve a **APIs & Services > Library**, busca "Google Sheets API" y actívala.
4. Ve a **APIs & Services > Credentials > Create Credentials > Service Account**.
5. Dale cualquier nombre (ej. "agua-agent-sheets"), termina la creación.
6. Entra a la cuenta de servicio creada > pestaña **Keys** > **Add Key > Create New Key > JSON**.
   Esto descarga un archivo `.json` — guárdalo, lo necesitas en el Paso 4.
7. Copia el "email" de la cuenta de servicio (algo como `agua-agent@tu-proyecto.iam.gserviceaccount.com`).
8. Vuelve a tu Google Sheet > botón **Compartir** > pega ese email y dale acceso de **Editor**.
   (Sin este paso, la función no podrá escribir en el Sheet.)

---

## Paso 3 — Crea cuenta en Netlify y sube este proyecto

1. Ve a https://app.netlify.com y crea una cuenta (gratis).
2. Sube este proyecto a un repo de GitHub (o arrástralo directo en Netlify con "Deploy manually" — más fácil si no usas Git).
3. Conecta el repo en Netlify: **Add new site > Import an existing project**.

---

## Paso 4 — Configura las variables de entorno en Netlify

En Netlify: **Site settings > Environment variables**, añade:

| Variable | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | Tu API key de Anthropic (consíguela en https://console.anthropic.com) |
| `GOOGLE_SHEET_ID` | El ID que copiaste en el Paso 1 |
| `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` | El contenido del archivo `.json` del Paso 2, convertido a base64 (ver abajo) |

### Cómo convertir el JSON a base64:

En Mac/Linux, abre terminal en la carpeta donde descargaste el archivo:
```bash
base64 -i nombre-del-archivo.json | tr -d '\n' | pbcopy
```
Esto lo copia directo al clipboard — pégalo como valor de `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` en Netlify.

(Si no tienes terminal a mano, dime y te ayudo con una alternativa.)

---

## Paso 5 — Despliega

1. Haz clic en **Deploy site** en Netlify.
2. Netlify detecta automáticamente la función programada (`carrusel-diario.mjs`) gracias al `netlify.toml`.
3. Corre sola cada día a las 10:00 UTC (6:00 AM hora de Puerto Rico).

---

## Cómo probarlo manualmente (sin esperar al día siguiente)

En el dashboard de Netlify > **Functions** > busca `carrusel-diario` > botón para invocarla manualmente.
Revisa el Google Sheet — debería aparecer una fila nueva en 20-30 segundos.

---

## Notas

- Esto NO publica en Instagram automáticamente. Solo te deja el contenido listo en el Sheet para que tú
  (o quien maneje tu Canva/CapCut) lo copie y arme las imágenes.
- Costo estimado: $0/mes en Netlify (plan free cubre esto sin problema) + el costo de las llamadas a la
  API de Claude (unos centavos al día).
- Si algún día quieres que también publique automático en Instagram, eso es un proyecto aparte (requiere
  la API de Meta para Instagram Business).
