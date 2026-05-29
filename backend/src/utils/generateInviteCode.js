import { randomBytes } from 'crypto';
export const generateInviteCode = () => randomBytes(3).toString('hex').toUpperCase();