/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import * as express from 'express';
import { environment } from './environments/environment';
import * as passport from 'passport';
import { BearerStrategy, IBearerStrategyOption } from 'passport-azure-ad';

const options: IBearerStrategyOption = {
  identityMetadata: `https://${environment.metadata.authority}/${environment.credentials.tenantID}/${environment.metadata.version}/${environment.metadata.discovery}`,
  issuer: `https://${environment.metadata.authority}/${environment.credentials.tenantID}/${environment.metadata.version}`,
  clientID: environment.credentials.clientID,
  audience: environment.credentials.audience,
  validateIssuer: environment.settings.validateIssuer,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  passReqToCallback: environment.settings.passReqToCallback,
  loggingLevel: environment.settings.loggingLevel as 'info' | 'error',
  scope: environment.resource.scope,
};

const bearerStrategy = new BearerStrategy(options, (token, done) => {
  done(null, {}, token);
});

const app = express();

app.use(passport.initialize());
passport.use(bearerStrategy);

// enable CORS (for testing only -remove in production/deployment)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Authorization, Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

app.get('/', (req, res) => {
  res.json({ msg: 'welcome' });
});

app.get(
  '/api',
  passport.authenticate('oauth-bearer', { session: false }),
  (req, res) => {
    console.log('Validated claims: ', req.authInfo);

    // Service relies on the name claim.
    res.status(200).json({
      name: req.authInfo['name'],
      'issued-by': req.authInfo['iss'],
      'issued-for': req.authInfo['aud'],
      scope: req.authInfo['scp'],
    });
  }
);

const port = process.env.port || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
  console.log(options);
});
server.on('error', console.error);
