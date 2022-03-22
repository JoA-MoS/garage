export const environment = {
  production: false,
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },
};
