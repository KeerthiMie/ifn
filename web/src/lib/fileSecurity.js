// Automated screening algorithm and file security controls for Problem Hub multi-format uploads.
// Enforces:
// 1. Strict file size ceilings (max 25MB per file, max 5 files total)
// 2. Extension whitelisting & malicious extension blacklisting
// 3. Double extension attack prevention (e.g., diagram.pdf.exe)
// 4. Path traversal / null byte sanitization
// 5. Binary magic byte / header verification
// 6. SVG sanitation against active content / XSS (<script>, onload, javascript:, etc.)

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB
export const MAX_ATTACHMENTS_PER_PROBLEM = 5

export const ALLOWED_EXTENSIONS = [
  'png', 'jpg', 'jpeg', 'webp', 'svg',
  'pdf',
  'mp4', 'webm', 'ogg',
  'mp3', 'wav',
]

export const ALLOWED_MIME_TYPES = [
  // Images
  'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf',
  // Video
  'video/mp4', 'video/webm', 'video/ogg',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm',
]

// Known dangerous extensions that must always be blocked
const BLACKLISTED_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'msi', 'dll', 'com', 'pif', 'scr', 'vbs', 'js', 'mjs',
  'jar', 'ps1', 'py', 'php', 'phtml', 'asp', 'aspx', 'cgi', 'pl', 'htm', 'html',
  'xhtml', 'hta', 'cpl', 'wsf', 'bin', 'app', 'deb', 'rpm', 'apk', 'iso', 'dmg',
])

export function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Universal RFC4122 v4 UUID fallback for HTTP / non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getFileCategory(mime, ext) {
  const e = (ext || '').toLowerCase()
  if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(e) || mime.startsWith('image/')) return 'image'
  if (e === 'pdf' || mime === 'application/pdf') return 'pdf'
  if (['mp4', 'webm'].includes(e) || mime.startsWith('video/')) return 'video'
  if (['mp3', 'wav', 'ogg'].includes(e) || mime.startsWith('audio/')) return 'audio'
  return 'file'
}

export function sanitizeFileName(name) {
  return (name || 'file')
    .replace(/\0/g, '') // remove null bytes
    .replace(/[/\\]/g, '_') // remove path separators
    .replace(/[^a-zA-Z0-9._-]/g, '_') // sanitize non-alphanumeric chars
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Inspects binary magic bytes / signatures of an ArrayBuffer.
 */
function verifyMagicBytes(buffer, ext) {
  const bytes = new Uint8Array(buffer)
  const len = bytes.length
  const e = (ext || '').toLowerCase()

  // Helper: check hex string prefix
  const hex = Array.from(bytes.slice(0, 16)).map((b) => b.toString(16).padStart(2, '0')).join('')

  if (e === 'png') {
    // 89 50 4E 47 0D 0A 1A 0A
    return hex.startsWith('89504e470d0a1a0a')
  }

  if (e === 'jpg' || e === 'jpeg') {
    // FF D8 FF
    return hex.startsWith('ffd8ff')
  }

  if (e === 'pdf') {
    // 25 50 44 46 (%PDF-)
    return hex.startsWith('25504446')
  }

  if (e === 'webp') {
    // RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
    const str = String.fromCharCode(...bytes.slice(0, 12))
    return str.startsWith('RIFF') && str.slice(8, 12) === 'WEBP'
  }

  if (e === 'wav') {
    // RIFF....WAVE
    const str = String.fromCharCode(...bytes.slice(0, 12))
    return str.startsWith('RIFF') && str.slice(8, 12) === 'WAVE'
  }

  if (e === 'ogg') {
    // OggS (4F 67 67 53)
    return hex.startsWith('4f676753')
  }

  if (e === 'mp3') {
    // ID3 or sync word (FF FB / FF F3 / FF F2)
    const isId3 = hex.startsWith('494433')
    const isSync = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0
    return isId3 || isSync
  }

  if (e === 'mp4') {
    // ftyp at index 4-7
    if (len >= 12) {
      const ftyp = String.fromCharCode(...bytes.slice(4, 8))
      return ftyp === 'ftyp'
    }
    return false
  }

  if (e === 'webm') {
    // EBML header: 1A 45 DF A3
    return hex.startsWith('1a45dfa3')
  }

  return true
}

/**
 * Deep text scan on SVG to prevent XSS / malicious active content.
 */
async function screenSvg(file) {
  const text = await file.text()
  const lower = text.toLowerCase()

  // Must contain an <svg tag
  if (!lower.includes('<svg')) {
    throw new Error('Invalid SVG format: missing <svg> element.')
  }

  // Reject active content, scripts, and event listeners
  const dangerousPatterns = [
    /<script[\s>]/,
    /javascript:/,
    /data:text\/html/,
    /onload\s*=/i,
    /onerror\s*=/i,
    /onclick\s*=/i,
    /onmouseover\s*=/i,
    /<iframe[\s>]/,
    /<object[\s>]/,
    /<embed[\s>]/,
    /<foreignobject[\s>]/,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(lower)) {
      throw new Error('Security policy violation: SVG contains active scripts or disallowed elements.')
    }
  }

  return true
}

/**
 * Automated screening algorithm.
 * Inspects file size, extension, double extension, MIME type, and binary header.
 * Throws an Error with a human-readable explanation if screening fails.
 */
export async function screenUploadedFile(file) {
  if (!file) throw new Error('No file provided.')

  // 1. File size ceiling check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size (${formatFileSize(file.size)}) exceeds the ceiling limit of ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`
    )
  }
  if (file.size === 0) {
    throw new Error('Empty files cannot be uploaded.')
  }

  // 2. File name validation & character check
  const rawName = file.name || ''
  if (/\0/.test(rawName) || rawName.includes('..')) {
    throw new Error('Malicious path traversal or null character detected in file name.')
  }

  // 3. Extension extraction and double-extension check
  const parts = rawName.toLowerCase().split('.').filter(Boolean)
  if (parts.length < 2) {
    throw new Error('Files without a valid extension are not allowed.')
  }

  const primaryExt = parts[parts.length - 1]

  // Check if any intermediate part is a dangerous executable extension (e.g. file.exe.pdf or file.pdf.exe)
  for (const part of parts.slice(0, -1)) {
    if (BLACKLISTED_EXTENSIONS.has(part)) {
      throw new Error(`Suspicious double-extension detected containing .${part}. File rejected.`)
    }
  }

  if (BLACKLISTED_EXTENSIONS.has(primaryExt)) {
    throw new Error(`Executable and script files (.${primaryExt}) are strictly prohibited.`)
  }

  // 4. Allowed extension whitelist check
  if (!ALLOWED_EXTENSIONS.includes(primaryExt)) {
    throw new Error(
      `Format .${primaryExt} is not supported. Supported formats: Schematic Images (PNG, JPG, SVG, WebP), PDFs, and Audio/Video clips (MP4, WebM, MP3, WAV, OGG).`
    )
  }

  // 5. Special screening for SVG
  if (primaryExt === 'svg' || file.type === 'image/svg+xml') {
    await screenSvg(file)
    return { ok: true, category: 'image', ext: 'svg', safeName: sanitizeFileName(rawName) }
  }

  // 6. Binary Magic Byte Screening (read first 64 bytes)
  const headerSlice = file.slice(0, 64)
  const arrayBuffer = await headerSlice.arrayBuffer()
  const validHeader = verifyMagicBytes(arrayBuffer, primaryExt)

  if (!validHeader) {
    throw new Error(
      `Automated file screening failed: binary signature for .${primaryExt} does not match the declared extension.`
    )
  }

  const category = getFileCategory(file.type, primaryExt)
  return {
    ok: true,
    category,
    ext: primaryExt,
    safeName: sanitizeFileName(rawName),
  }
}

