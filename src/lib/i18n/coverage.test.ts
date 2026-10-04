import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { pl } from './pl/index'
import { makeT, polishPlural, translate } from './translate'

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    if (e.isDirectory()) return sourceFiles(p)
    return /\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [p] : []
  })
}

const STRING = String.raw`(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")`
const unescape = (s: string) => s.replace(/\\(['"\\])/g, '$1')

/** Every literal passed to t(), t.plural() (plural form) or translate(). */
export function collectKeys(root = 'src') {
  const keys = new Map<string, string>()
  const single = new RegExp(String.raw`\b(?:t|tr)\(\s*` + STRING, 'g')
  const viaTranslate = new RegExp(String.raw`\btranslate\(\s*[\w.]+(?:\(\))?,\s*` + STRING, 'g')
  const plural = new RegExp(
    String.raw`\bt\.plural\(\s*[^,]+,\s*` + STRING + String.raw`\s*,\s*` + STRING,
    'g',
  )
  const marked = new RegExp(String.raw`\b(?:msg|pageTitle)\(\s*` + STRING, 'g')
  for (const file of sourceFiles(root)) {
    if (file.includes(join('i18n', 'pl'))) continue
    const text = readFileSync(file, 'utf8')
    for (const re of [single, viaTranslate, marked])
      for (const m of text.matchAll(re)) keys.set(unescape(m[1] ?? m[2]!), file)
    for (const m of text.matchAll(plural)) keys.set(unescape(m[3] ?? m[4]!), file)
  }
  return keys
}

describe('i18n', () => {
  it('has a Polish translation for every UI string', () => {
    const missing = [...collectKeys()].filter(([k]) => !(k in pl)).map(([k, f]) => `${f}: ${k}`)
    expect(missing).toEqual([])
  })

  it('keeps placeholders intact in translations', () => {
    const broken = Object.entries(pl).filter(([k, v]) => {
      const vars = (s: string) =>
        [...s.matchAll(/\{(\w+)\}/g)]
          .map((m) => m[1])
          .sort()
          .join()
      const forms = typeof v === 'string' ? [v] : [...v]
      return forms.some((f) => vars(f) !== vars(k))
    })
    expect(broken.map(([k]) => k)).toEqual([])
  })

  it('applies Polish plural rules', () => {
    expect([1, 2, 4, 5, 12, 14, 22, 25, 101, 0].map(polishPlural)).toEqual([
      0, 1, 1, 2, 2, 2, 1, 2, 2, 2,
    ])
    const t = makeT('en')
    expect(t.plural(1, '{n} task', '{n} tasks')).toBe('1 task')
    expect(t.plural(3, '{n} task', '{n} tasks')).toBe('3 tasks')
    expect(translate('en', 'Hello {name}', { name: 'Ala' })).toBe('Hello Ala')
    expect(translate('pl', 'Not in the dictionary')).toBe('Not in the dictionary')
  })
})
