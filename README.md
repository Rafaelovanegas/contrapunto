# CONTRAPUNTO

**NEURALEXIA · ECOSISTEMA INTELIGENTE** — aplicación jurídica **CODELEXIA**.

Asistente de interrogatorio y contrainterrogatorio con IA para litigación oral (sistema acusatorio mexicano). Creado para la conferencia *Técnica de litigación oral, interrogatorio y contrainterrogatorio con IA* (21 de octubre de 2026).

> La IA sugiere; el abogado decide. Herramienta de preparación y práctica. No sustituye la asesoría jurídica.

## Qué hace

| Sección | Función |
| --- | --- |
| Audiencia | Interrogas a un testigo de IA (con voz). Cada pregunta pasa por el semáforo del art. 373 CNPP y cada respuesta se compara con los registros previos del testigo. |
| Expediente | Testigos, teoría del caso y documentos: PDF (también escaneado), Word .docx, .txt e imágenes. Transcripción editable. |
| Preparación | Propuesta de interrogatorio directo o contrainterrogatorio a partir de la teoría del caso y los registros previos. |
| Semáforo | Califica una pregunta como válida u objetable, con motivo y reformulación. |
| En vivo | Para la versión presencial: escucha a un testigo humano y busca contradicciones. |
| Ajustes | Llaves (BYOK), modelo, voz, tema, tamaño de letra y modo demostración. |

**Regla de honestidad en código:** una alerta de contradicción solo se muestra si la cita del registro previo aparece literalmente en el documento (`src/lib/validate.js`). Si la IA propone una cita que no está, la alerta se descarta y se avisa.

**Modo demostración:** viene activado. Funciona sin llaves ni internet, con respuestas grabadas del caso ficticio. Es el plan B de la charla.

## Coordenadas (Arquitecto NEURALEXIA)

A6 que contiene un A2 (escucha → compara → sugiere). B0 deliberante, B fijo: la app solo sugiere, nunca actúa.

## Ejecutar en local

Requiere Node 22 o superior.

```bash
npm install
npm run dev        # http://localhost:5274
npm test           # validación de citas y contraste de colores
npm run build      # versión de producción en dist/
```

## Publicar en Vercel

1. Sube este repositorio a GitHub.
2. En Vercel: *Add New → Project*, importa el repositorio. Vercel detecta Vite: comando `npm run build`, carpeta `dist`.
3. Despliega. No hay variables de entorno: las llaves las introduce cada usuario en *Ajustes*.

## Instalar en el teléfono (PWA)

- **Android (Chrome):** abre la URL → menú ⋮ → *Agregar a la pantalla principal*.
- **iPhone (Safari):** abre la URL → botón Compartir → *Agregar a inicio*.

La voz por micrófono funciona en Chrome y Edge.

## Llaves (BYOK)

- **Anthropic:** obligatoria para usar la IA fuera del modo demostración. Se obtiene en la consola de Anthropic.
- **ElevenLabs:** opcional, para la voz del testigo. Sin ella se usa la voz del navegador.

Se guardan solo en el navegador del dispositivo y viajan únicamente en las cabeceras de cada solicitud. Llamar a la API de Anthropic desde el navegador expone la llave a quien use ese equipo: no compartas la app con tu llave cargada. Antes de ofrecerla a terceros o cobrarla, correr la auditoría de producción (`kalvo-skill-auditoria-app`) y mover las llamadas a un servidor propio.

## Avisos legales

- **Secreto profesional:** no introducir información amparada por secreto profesional ni datos de casos reales sin autorización. Los textos, documentos y audio se procesan en servidores de terceros (Anthropic, ElevenLabs y el servicio de reconocimiento de voz del navegador).
- **Datos personales:** antes de un uso con terceros se requiere aviso de privacidad conforme a la legislación mexicana aplicable.
- **El caso precargado es ficticio.** Personas, folios, matrículas y lugares son inventados.

## Configuración técnica

- Modelos (verificados el 2026-10-16 en la documentación oficial): `claude-sonnet-5-5` por defecto, `claude-haiku-5-5`, `claude-opus-5-5`. Un solo lugar: `src/config.js`.
- Voz: ElevenLabs `POST /v1/text-to-speech/{voice_id}`, modelo `eleven_multilingual_v2`.
- Stack: React 19 + Vite 8, sin backend. Puerto local propio: 5274.
