import crypto from 'crypto';

const generateUniqueId = (): string => {
  const currentYear: string = new Date().getFullYear().toString().substr(-2);
  return currentYear + crypto.randomBytes(3).toString('hex');
};

export default generateUniqueId;