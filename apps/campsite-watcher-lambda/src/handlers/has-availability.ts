import {
  checkAvailability,
  notify,
  WatchOptions,
} from '@garage/campsite-watcher-core';
import { APIGatewayProxyResult } from 'aws-lambda';
import { environment } from '../environments/environment';

export async function hasAvailability(
  event: WatchOptions
): Promise<APIGatewayProxyResult> {
  const res = await checkAvailability(event);
  if (res) {
    console.log(new Date().toISOString());
    console.log(res.summary);
    if (res.details.length > 0) {
      console.table(res.details);
      const transportOptions = {
        host: environment.smtp.host,
        port: Number(environment.smtp.port),
        secure: Boolean(environment.smtp.secure),
        auth: {
          user: environment.smtp.user,
          pass: environment.smtp.password, // generated ethereal password
        },
      };
      notify(res, transportOptions);
    }
  }
  return {
    statusCode: 201,
    body: JSON.stringify(res),
  };
}
