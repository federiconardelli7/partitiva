// Sbustamento della busta CAdES (.p7m): NIENTE verifica di firma (fuori scope),
// solo estrazione del payload XML incorporato nel blob DER — o nella sua codifica base64.
//
// Il latin1 serve SOLO a localizzare gli offset (1 byte = 1 carattere, quindi gli indici sul
// testo-sonda sono offset in byte); il payload viene poi ridecodificato come UTF-8, altrimenti
// gli accenti delle descrizioni ("Attività") uscirebbero storpiati ("AttivitÃ ").

const BASE64 = /^[A-Za-z0-9+/=\r\n\s]+$/

const decodificaLatin1 = (bytes: Uint8Array): string => new TextDecoder('latin1').decode(bytes)

const daBase64 = (testo: string): Uint8Array => {
  const pulito = testo.replace(/\s+/g, '')
  const binario = atob(pulito)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return bytes
}

export function sbustaP7m(bytes: Uint8Array): string {
  let buffer = bytes
  let sonda = decodificaLatin1(buffer)

  // Alcuni p7m circolano ricodificati in base64: si decodifica e si riprova.
  if (!sonda.includes('FatturaElettronica') && sonda.length > 64 && BASE64.test(sonda)) {
    try {
      buffer = daBase64(sonda)
      sonda = decodificaLatin1(buffer)
    } catch {
      // resta il buffer originale: fallirà sotto con l'errore esplicito
    }
  }

  let inizio = sonda.indexOf('<?xml')
  if (inizio === -1) {
    const tagRadice = sonda.indexOf('FatturaElettronica')
    if (tagRadice !== -1) inizio = sonda.lastIndexOf('<', tagRadice)
  }
  const chiusura = sonda.lastIndexOf('FatturaElettronica>')
  const fine = chiusura === -1 ? -1 : chiusura + 'FatturaElettronica>'.length

  if (inizio === -1 || fine <= inizio) {
    throw new Error('Payload XML non trovato nella busta p7m')
  }
  return new TextDecoder('utf-8').decode(buffer.slice(inizio, fine))
}
