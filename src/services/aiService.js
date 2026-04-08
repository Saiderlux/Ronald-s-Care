// src/services/aiService.js
// Servicio encargado de interactuar con el LLM Gemma a través de la API local de Ollama.

const OLLAMA_URL = 'http://localhost:11434/api/generate';

/**
 * Función general para pedir una generación a Gemma (Soporta Streaming)
 * @param {string} prompt 
 * @param {function} onChunk - Callback opcional para manejar el flujo de texto en tiempo real
 * @returns {Promise<string>}
 */
export async function generateTextWithOllama(prompt, onChunk) {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma:2b', // Cambiado a 2b para mayor velocidad
        prompt: prompt,
        stream: !!onChunk, 
        keep_alive: "1h", // Mantener en memoria para la siguiente petición rápida
        options: {
          num_ctx: 512,      // Micro-contexto para procesar rápido
          num_predict: 150,  // Longitud estricta para evitar que divague
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en la respuesta de Ollama: ${response.statusText}`);
    }

    if (!onChunk) {
      const data = await response.json();
      return data.response.trim();
    }

    // Manejo de Streaming
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Mantener la última línea parcial en el búfer
      
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.response) {
            fullText += json.response;
            onChunk(fullText);
          }
        } catch (e) {
          // Ignorar errores de parseo en líneas incompletas
        }
      }
    }
    return fullText;

  } catch (error) {
    console.error('Fallo en Ollama Service:', error);
    return "Fallback (Ollama no disponible): " + prompt.substring(0, 50) + "...";
  }
}

/**
 * Función especializada para generar un correo de agradecimiento.
 */
export async function generarCorreoAgradecimiento(nombreCompleto, donanteEmail, ticketInfoContext, onChunk) {
  const prompt = `Eres un asistente amable de la Fundación Ronald McDonald. 
Necesitas escribir un correo muy corto y emotivo de agradecimiento a "${nombreCompleto}" (correo: ${donanteEmail})
quien acaba de donar para ayudar a los niños.
Contexto de la donación/foto: ${ticketInfoContext}
No incluyas saludos formales aburridos, hazlo directo, transparente y sincero. Mantenlo por debajo de 50 palabras.`;

  return await generateTextWithOllama(prompt, onChunk);
}

/**
 * Función para evaluar cuestionario de voluntarios.
 */
export async function evaluarVoluntario(respuestas) {
  const prompt = `Eres un evaluador de voluntarios para la Casa Ronald McDonald.
Aquí están las respuestas del cuestionario de un aplicante:
${JSON.stringify(respuestas)}

Evalúa estas respuestas y determina si el candidato es "ACEPTADO" o "RECHAZADO".
También proporciona un pequeño "feedback" o comentario.
Responde estrictamente en formato JSON válido:
{ "estado": "ACEPTADO" | "RECHAZADO", "feedback": "tu comentario" }`;

  try {
    const response = await generateTextWithOllama(prompt);
    // Tratar de parsear el JSON
    const cleanJsonString = response.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJsonString);
  } catch(e) {
    console.error("Error parseando respuesta JSON de ollama", e)
    return { estado: "ERROR", feedback: "Ocurrió un error al evaluar usando IA local." };
  }
}

/**
 * Función para que el Admin analice rápidamente el perfil de un voluntario con IA
 */
export async function analizarCandidatoAdmin(candidato, iniciativa, onChunk) {
  const prompt = `Eres un seleccionador evaluando a un voluntario ("${candidato.name}") para la iniciativa "${iniciativa || 'General'}".
Datos del candidato:
- Edad: ${candidato.age || 'No especificada'}
- Motivación: ${candidato.motivation || 'No especificada'}

Genera un resumen muy breve en un solo párrafo indicando si el perfil luce adecuado y qué aporta de valor. Ve directo al grano sin saludos ni despedidas limitando la respuesta a 50 palabras.`;

  return await generateTextWithOllama(prompt, onChunk);
}

