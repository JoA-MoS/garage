const IS_PRODUCTION = process.env['IS_PRODUCTION'] === 'true';
const IS_OFFLINE = process.env['IS_OFFLINE'] === 'true';

export const environment = {
  production: IS_PRODUCTION,
  offline: IS_OFFLINE,
  smtp: {
    host: process.env['SMTP_HOST'] || 'smtp.gmail.com',
    port: process.env['SMTP_PORT'] || 465,
    secure: process.env['SMTP_SECURE'] || true,
    user: process.env['SMTP_USER'] || 'ERROR_SMTP_USER_NOT_DEFINED',
    password: process.env['SMTP_PASSWORD'] || 'ERROR_SMTP_PASSWORD_NOT_DEFINED',
  },
};
