import { describe, expect, it } from 'vitest'
import { cents, euro, mulRate, roundEuroToCents, splitInRate } from '../src/money'

describe('money — centesimi interi e arrotondamenti espliciti', () => {
  it('euro() converts euros to integer cents', () => {
    expect(euro(4192.06)).toBe(419_206)
    expect(euro(0)).toBe(0)
  })

  it('cents() rejects non-integer amounts', () => {
    expect(() => cents(100.5)).toThrow()
    expect(cents(100)).toBe(100)
  })

  it('mulRate rounds half-up on exact half cents (13.100,175 → 13.100,18)', () => {
    // 50.250,00 × 26,07 % = 13.100,175 → half-up → 13.100,18
    expect(mulRate(cents(5_025_000), 0.2607)).toBe(1_310_018)
  })

  it('mulRate is exact on integer-friendly products', () => {
    expect(mulRate(cents(1_608_000), 0.2607)).toBe(419_206) // 4.192,056 → 4.192,06
    expect(mulRate(cents(4_270_600), 0.05)).toBe(213_530)
    expect(mulRate(cents(2_400_000), 0.67)).toBe(1_608_000)
    expect(mulRate(cents(419_100), 0.8)).toBe(335_280)
  })

  it('roundEuroToCents rounds to whole euros (42.706,31 → 42.706,00)', () => {
    expect(roundEuroToCents(cents(4_270_631))).toBe(4_270_600)
    expect(roundEuroToCents(cents(4_270_650))).toBe(4_270_700) // half-up
    expect(roundEuroToCents(cents(4_270_649))).toBe(4_270_600)
  })

  it('roundEuroToCents on negatives rounds to the NEAREST euro (−67,67 → −68,00), not toward zero', () => {
    expect(roundEuroToCents(cents(-6_767))).toBe(-6_800)
    expect(roundEuroToCents(cents(-6_750))).toBe(-6_800) // half away from zero, simmetrico al positivo
    expect(roundEuroToCents(cents(-6_749))).toBe(-6_700)
  })

  it('splitInRate gives the extra cent to the first installment (3.352,69 → 1.676,35 + 1.676,34)', () => {
    expect(splitInRate(cents(335_269))).toEqual([167_635, 167_634])
    expect(splitInRate(cents(335_280))).toEqual([167_640, 167_640])
  })

  it('splitInRate is driven by the ripartizione parameter (art. 58 DL 124/2019 vive nei params)', () => {
    expect(splitInRate(cents(10_000), [0.4, 0.6])).toEqual([4_000, 6_000])
    expect(splitInRate(cents(10_001), [0.4, 0.6])).toEqual([4_000, 6_001])
  })
})
