import { describe, expect, it } from 'vitest'
import { ENGINE_NAME } from '../src/index'

describe('motore-fiscale scaffold', () => {
  it('exposes the package entrypoint', () => {
    expect(ENGINE_NAME).toBe('motore-fiscale')
  })
})
