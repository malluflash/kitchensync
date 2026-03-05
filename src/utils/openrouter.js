const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PEXELS_URL = 'https://api.pexels.com/v1/search';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';

/**
 * Fetch a single landscape food photo from Pexels matching the query.
 * Returns a direct image URL string, or null on failure.
 */
async function fetchPexelsImage(pexelsKey, query) {
  if (!pexelsKey) return null;
  try {
    const res = await fetch(
      `${PEXELS_URL}?query=${encodeURIComponent(query + ' food')}&per_page=1&orientation=landscape`,
      { headers: { Authorization: pexelsKey.trim() } }
    );
    if (!res.ok) {
      console.warn('[Pexels] Request failed:', res.status);
      return null;
    }
    const data = await res.json();
    const url = data.photos?.[0]?.src?.large2x || data.photos?.[0]?.src?.large || null;
    console.log('[Pexels] Image for', JSON.stringify(query), '->', url ? 'found' : 'not found');
    return url;
  } catch (e) {
    console.warn('[Pexels] Error fetching image:', e.message);
    return null;
  }
}

/**
 * Build a plain-English description of the fridge contents for the AI prompt.
 */
function buildFridgeContext(fridgeItems) {
  if (!fridgeItems || fridgeItems.length === 0) {
    return 'The fridge is currently empty.';
  }

  const today = new Date();
  const lines = fridgeItems.map((item) => {
    const parts = [item.emoji ? `${item.emoji} ` : '', item.name];
    if (item.quantity) parts.push(`(${item.quantity} ${item.unit || 'units'})`);
    if (item.expiryDate) {
      const diff = Math.ceil((new Date(item.expiryDate) - today) / (1000 * 60 * 60 * 24));
      if (diff < 0) parts.push('[EXPIRED]');
      else if (diff === 0) parts.push('[expires today]');
      else if (diff === 1) parts.push('[expires tomorrow]');
      else parts.push(`[expires in ${diff} days]`);
    }
    return parts.join(' ');
  });

  return lines.join('\n');
}

/**
 * Call OpenRouter to get AI-powered recipe suggestions based on current fridge items.
 * Returns an array of recipe objects:
 *   { title, time, description, missing, priority }
 */
export async function getAIRecipes(apiKey, fridgeItems, { mealType, dietary, pexelsKey } = {}) {
  console.log('[OpenRouter] getAIRecipes called');
  console.log('[OpenRouter] API key length:', apiKey ? apiKey.trim().length : 0);
  console.log('[OpenRouter] Fridge items count:', fridgeItems?.length ?? 0);
  console.log('[OpenRouter] Fridge items:', JSON.stringify(fridgeItems?.map(i => i.name)));

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('NO_API_KEY');
  }

  const fridgeContext = buildFridgeContext(fridgeItems);
  console.log('[OpenRouter] Fridge context:\n', fridgeContext);

  const filters = [];
  if (mealType && mealType !== 'All') filters.push(`meal type: ${mealType}`);
  if (dietary && dietary.length > 0) filters.push(`dietary preferences: ${dietary.join(', ')}`);
  const filterNote = filters.length > 0 ? `\nFilters: ${filters.join(' | ')}` : '';

  const systemPrompt = `You are a smart kitchen assistant. Your job is to suggest recipes using the provided fridge ingredients. You MUST always return at least 2-3 recipe suggestions — never return an empty list.

Rules:
- Focus on food ingredients. If a fridge item doesn't look like a cooking ingredient (e.g. a product name, drink, or mystery item), simply ignore it.
- Be creative — even with just eggs and chillies you can suggest omelettes, scrambled eggs, chilli egg toast, spicy frittata, etc.
- Always prioritise recipes using items expiring soonest.
- Return ONLY a raw JSON array. No markdown, no code fences, no explanation. Your entire response must start with [ and end with ].

Each object must have EXACTLY these keys:
- "title": string
- "time": string — e.g. "15 min"
- "description": string — 1-2 sentences mentioning which fridge items it uses
- "missing": string or null — extra ingredients NOT in the fridge, or null
- "priority": boolean — true if uses items expiring within 3 days
- "imageQuery": string — 2-3 word search keyword for a food photo (e.g. "chilli omelette", "egg fried rice")
- "ingredients": array of strings — full ingredient list with quantities (e.g. ["2 eggs", "1 green chilli, chopped", "salt to taste"])
- "steps": array of strings — numbered cooking steps, each a complete sentence (4-7 steps)

Example:
[{"title":"Chilli Omelette","time":"10 min","description":"A fluffy omelette with spicy green chillies.","missing":null,"priority":false,"imageQuery":"chilli omelette egg","ingredients":["2 eggs","1 green chilli, finely chopped","salt and pepper to taste","1 tsp butter"],"steps":["Beat the eggs in a bowl with salt and pepper until fluffy.","Heat butter in a non-stick pan over medium heat.","Add the chopped green chilli and sauté for 30 seconds.","Pour in the egg mixture and cook until the edges set.","Fold the omelette in half and serve hot."]}]`;

  const userMessage = `My fridge contains:\n${fridgeContext}${filterNote}\n\nSuggest recipes I can make with these ingredients.`;

  console.log('[OpenRouter] Sending request to:', OPENROUTER_URL);
  console.log('[OpenRouter] User message:', userMessage);

  let response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://fridgera.app',
        'X-Title': 'FridgEra',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });
  } catch (networkErr) {
    console.error('[OpenRouter] Network error:', networkErr);
    throw new Error(`NETWORK_ERROR:${networkErr.message}`);
  }

  console.log('[OpenRouter] Response status:', response.status);

  if (!response.ok) {
    const errBody = await response.text();
    console.error('[OpenRouter] Error body:', errBody);
    if (response.status === 401) throw new Error(`INVALID_KEY:${errBody}`);
    if (response.status === 429) throw new Error(`RATE_LIMITED:${errBody}`);
    throw new Error(`API_ERROR:${response.status}:${errBody}`);
  }

  const data = await response.json();
  console.log('[OpenRouter] Raw response data:', JSON.stringify(data));

  const content = data?.choices?.[0]?.message?.content || '';
  console.log('[OpenRouter] Content from AI:', content);

  // Strip any accidental markdown fences
  const cleaned = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  console.log('[OpenRouter] Cleaned content:', cleaned);

  try {
    const recipes = JSON.parse(cleaned);
    if (!Array.isArray(recipes)) {
      console.error('[OpenRouter] Parsed value is not an array:', recipes);
      throw new Error('Not an array');
    }
    if (recipes.length === 0) {
      console.warn('[OpenRouter] Model returned empty array — no recipes suggested');
      throw new Error('EMPTY_RESPONSE');
    }
    console.log('[OpenRouter] Parsed', recipes.length, 'recipes successfully');

    // Enrich each recipe with a Pexels image URL (parallel fetch)
    const enriched = await Promise.all(
      recipes.map(async (recipe) => {
        const query = recipe.imageQuery || recipe.title || 'food';
        const imageUrl = await fetchPexelsImage(pexelsKey, query);
        return { ...recipe, imageUrl };
      })
    );
    return enriched;
  } catch (parseErr) {
    if (parseErr.message === 'EMPTY_RESPONSE') throw parseErr;
    console.error('[OpenRouter] Parse error:', parseErr.message, '| Raw content was:', cleaned);
    throw new Error(`PARSE_ERROR:${cleaned.substring(0, 200)}`);
  }
}
