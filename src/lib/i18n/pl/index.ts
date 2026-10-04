import { common } from './common'
import { extra } from './extra'
import { forms } from './forms'
import { lib } from './lib'
import { modules } from './modules'
import { modules2 } from './modules2'
import { modules3 } from './modules3'
import { pages } from './pages'
import { pages2 } from './pages2'

export type Dict = Record<string, string | readonly [string, string, string]>

/** Polish translations keyed by the English source text. */
export const pl: Dict = {
  ...common,
  ...lib,
  ...forms,
  ...modules,
  ...modules2,
  ...modules3,
  ...pages,
  ...pages2,
  ...extra,
}
