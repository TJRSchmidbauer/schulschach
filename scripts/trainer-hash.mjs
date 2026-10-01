import crypto from 'node:crypto';

const code = process.argv[2];
if (!code || code.length < 20) {
  console.error('Verwendung: npm run hash:trainer -- "DEIN_TRAINER_CODE" (min. 20 Zeichen)');
  process.exit(1);
}
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(code, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
console.log('TRAINER_CODE_HASH=scrypt:16384:8:1:%s:%s', salt, hash);
