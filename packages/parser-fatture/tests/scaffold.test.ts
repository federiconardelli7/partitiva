import { describe, expect, it } from 'vitest'
import { PARSER_NAME } from '../src/index'

describe('parser-fatture scaffold', () => {
  it('exposes the package entrypoint', () => {
    expect(PARSER_NAME).toBe('parser-fatture')
  })
})
