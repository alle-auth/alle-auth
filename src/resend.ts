import { config as dotenvConfig } from 'dotenv';
import { Resend } from 'resend';

dotenvConfig();
const resend = new Resend(process.env.RESEND_API_KEY);

export { resend };