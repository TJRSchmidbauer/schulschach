import crypto from 'node:crypto';

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.CODE_ENC_KEY ?? process.env.AUTH_SECRET ?? 'dev-secret';
  cachedKey = crypto.scryptSync(secret, 'schulschach-code-enc-v1', 32);
  return cachedKey;
}

export function generateStudentCode(): string {
  return crypto.randomBytes(5).toString('hex').toUpperCase();
}

export function encryptCode(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
}

export function decryptCode(stored: string): string | null {
  try {
    const [version, iv, tag, data] = stored.split(':');
    if (version !== 'v1' || !iv || !tag || !data) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    const plain = Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]);
    return plain.toString('utf8');
  } catch {
    return null;
  }
}
