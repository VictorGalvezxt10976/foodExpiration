import { FoodCategory, StorageLocation } from '../types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

export interface ScannedProductData {
  name?: string;
  expirationDate?: string;
  category?: FoodCategory;
  quantity?: number;
  unit?: string;
  storageLocation?: StorageLocation;
  price?: number;
}

const VALID_CATEGORIES: FoodCategory[] = [
  'fruits', 'vegetables', 'dairy', 'cereals', 'canned',
  'meat', 'frozen', 'beverages', 'condiments', 'snacks', 'other',
];

const VALID_LOCATIONS: StorageLocation[] = ['fridge', 'freezer', 'pantry', 'counter'];

export async function scanProductLabel(
  apiKey: string,
  imageBase64: string,
): Promise<ScannedProductData> {
  if (!apiKey) {
    throw new Error('No se ha configurado la API key de OpenAI. Ve a Ajustes para agregarla.');
  }

  const systemPrompt = `Eres un asistente experto en identificar productos alimenticios a partir de fotos de etiquetas. Analiza la imagen y extrae la informacion que puedas identificar. Responde UNICAMENTE con un JSON valido, sin texto adicional, con los siguientes campos (todos opcionales, incluye solo los que puedas identificar):

{
  "name": "Nombre del producto",
  "expirationDate": "YYYY-MM-DD",
  "category": "una de: ${VALID_CATEGORIES.join(', ')}",
  "quantity": 1,
  "unit": "kg, g, L, mL, pzas, etc.",
  "storageLocation": "una de: ${VALID_LOCATIONS.join(', ')}",
  "price": 0.00
}

Notas:
- La fecha debe estar en formato YYYY-MM-DD
- La categoria debe ser exactamente uno de los valores listados
- La ubicacion (storageLocation) debe ser exactamente uno de los valores listados
- Si no puedes identificar un campo con certeza, no lo incluyas
- Para storageLocation, usa tu conocimiento sobre el producto para sugerir donde almacenarlo`;

  let response: Response;
  try {
    response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analiza esta etiqueta de producto alimenticio y extrae los datos que puedas identificar.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });
  } catch {
    throw new Error('Error de conexion. Verifica tu internet e intenta de nuevo.');
  }

  if (response.status === 401) {
    throw new Error('API key invalida. Verifica tu clave en Ajustes.');
  }

  if (response.status === 429) {
    throw new Error('Demasiadas solicitudes. Espera un momento e intenta de nuevo.');
  }

  if (!response.ok) {
    throw new Error(`Error del servidor (${response.status}). Intenta de nuevo mas tarde.`);
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = await response.json();
  } catch {
    throw new Error('Error al procesar la respuesta del servidor.');
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No se recibio respuesta del modelo.');
  }

  let parsed: ScannedProductData;
  try {
    parsed = JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo interpretar la etiqueta. Intenta con una foto mas clara.');
    }
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error('No se pudo interpretar la etiqueta. Intenta con una foto mas clara.');
    }
  }

  const result: ScannedProductData = {};

  if (parsed.name && typeof parsed.name === 'string') {
    result.name = parsed.name;
  }
  if (parsed.expirationDate && typeof parsed.expirationDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.expirationDate)) {
    result.expirationDate = parsed.expirationDate;
  }
  if (parsed.category && VALID_CATEGORIES.includes(parsed.category)) {
    result.category = parsed.category;
  }
  if (parsed.quantity != null && typeof parsed.quantity === 'number' && parsed.quantity > 0) {
    result.quantity = parsed.quantity;
  }
  if (parsed.unit && typeof parsed.unit === 'string') {
    result.unit = parsed.unit;
  }
  if (parsed.storageLocation && VALID_LOCATIONS.includes(parsed.storageLocation)) {
    result.storageLocation = parsed.storageLocation;
  }
  if (parsed.price != null && typeof parsed.price === 'number' && parsed.price > 0) {
    result.price = parsed.price;
  }

  return result;
}
