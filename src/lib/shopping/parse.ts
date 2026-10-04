/** "2 kg chicken" -> { quantity: 2, unit: 'kg', name: 'chicken' }; "milk x3" -> 3 milk. */
export function parseShoppingItem(input: string) {
  const text = input.trim().replace(/\s+/g, ' ')
  const units = '(kg|g|l|ml|pcs|pc|szt|pack|packs|bottle|bottles|can|cans|dozen)'
  let m = text.match(new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s?${units}?\\s+(.+)$`, 'i'))
  if (m)
    return {
      quantity: Number(m[1]!.replace(',', '.')),
      unit: m[2]?.toLowerCase() ?? null,
      name: m[3]!,
    }
  m = text.match(/^(.+?)\s*[x×]\s*(\d+(?:[.,]\d+)?)$/i)
  if (m) return { quantity: Number(m[2]!.replace(',', '.')), unit: null, name: m[1]! }
  return { quantity: null, unit: null, name: text }
}

const CATEGORY_HINTS: [string, RegExp][] = [
  ['Dairy', /\b(milk|cheese|yogurt|yoghurt|butter|cream|eggs?|mleko|ser|jogurt|masło|jajka)\b/i],
  [
    'Produce',
    /\b(apples?|bananas?|vegetables?|fruit|tomato(es)?|potato(es)?|onions?|salad|lettuce|carrots?|warzywa|owoce)\b/i,
  ],
  ['Meat & fish', /\b(chicken|beef|pork|fish|salmon|ham|turkey|kurczak|mięso|ryba)\b/i],
  ['Bakery', /\b(bread|rolls?|bagels?|chleb|bułki)\b/i],
  [
    'Household',
    /\b(toilet paper|detergent|soap|sponges?|paper towels?|trash bags|papier toaletowy|mydło)\b/i,
  ],
  ['Drinks', /\b(water|juice|coffee|tea|beer|wine|soda|woda|sok|kawa|herbata)\b/i],
]

export function guessShoppingCategory(name: string) {
  return CATEGORY_HINTS.find(([, re]) => re.test(name))?.[0] ?? null
}
