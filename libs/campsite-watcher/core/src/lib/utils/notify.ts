import { createTransport } from 'nodemailer';

import { WatchOptions } from '../interfaces/watch-options.interface';
import { renderAvailabilityEmail } from '../emails/availability';
import { Campsite } from '../interfaces';

export async function notify(
  {
    watchConfig,
    summary,
    details,
  }: {
    watchConfig: WatchOptions;
    summary: string;
    details: Campsite[];
  },
  transportOptions: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  }
) {
  // console.log({ transportOptions });

  const transporter = createTransport({
    host: transportOptions.host,
    port: transportOptions.port,
    // requireTLS: true,
    secure: transportOptions.secure,
    auth: {
      user: transportOptions.auth.user,
      pass: transportOptions.auth.pass,
    },
    logger: true,
  });

  const info = await transporter.sendMail({
    from: transportOptions.auth.user,
    to: watchConfig.emails,
    subject: summary,
    html: renderAvailabilityEmail(
      details.map((v) => ({
        id: v.id,
        site: v.site,
        type: v.type,
        loop: v.loop,
        dates: v.dates,
      }))
    ),
  });

  console.log(`Message sent: ${info.messageId}`);
}
