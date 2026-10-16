// Configuración central de CONTRAPUNTO. Los identificadores de modelo viven SOLO aquí.
// Verificados el 2026-10-16 en https://platform.claude.com/docs/en/models/overview
export const MODELOS = [
  { id: 'claude-sonnet-5-5', etiqueta: 'Claude Sonnet 5.5 · equilibrio velocidad / calidad (recomendado)' },
  { id: 'claude-haiku-5-5', etiqueta: 'Claude Haiku 5.5 · el más rápido' },
  { id: 'claude-opus-5-5', etiqueta: 'Claude Opus 5.5 · máxima calidad, más lento' },
];
export const MODELO_POR_DEFECTO = 'claude-sonnet-5-5';

export const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_VERSION = '2023-06-01';

// ElevenLabs: POST /v1/text-to-speech/{voice_id}, cabecera xi-api-key.
export const ELEVEN_TTS_URL = 'https://api.elevenlabs.io/v1/text-to-speech/';
export const ELEVEN_VOICES_URL = 'https://api.elevenlabs.io/v1/voices';
export const ELEVEN_MODELO_TTS = 'eleven_multilingual_v2';

// max_tokens por cargo: síntesis y crítica requieren más que una opinión.
export const TOKENS = {
  testigo: 400,
  semaforo: 600,
  contradiccion: 900,
  preparacion: 2500,
  extraccion: 8000,
};

export const LIMITE_ARCHIVO_MB = 20;

export const TEMAS = [
  { id: 'codelexia', nombre: 'CODELEXIA (oscuro)' },
  { id: 'borgona', nombre: 'Borgoña nocturno' },
  { id: 'pergamino', nombre: 'Pergamino (claro)' },
];
