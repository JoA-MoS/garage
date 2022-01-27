export const environment = {
  production: false,
  openIDConnectConfig: {
    host: process.env.API_HOST || `http://localhost`,
    tenant: process.env.TENANT,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    port: process.env.PORT || 3333,
    redirectPath: '/auth/openid/return',
  },
  credentials: {
    tenantID: process.env.TENANT,
    clientID: process.env.CLIENT_ID,
    audience: process.env.CLIENT_ID,
  },
  resource: {
    scope: ['access_as_user'],
  },
  metadata: {
    authority: 'login.microsoftonline.com',
    discovery: '.well-known/openid-configuration',
    version: 'v2.0',
  },
  settings: {
    validateIssuer: true,
    passReqToCallback: false,
    loggingLevel: 'info',
  },
};
