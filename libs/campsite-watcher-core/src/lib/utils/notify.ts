import { createTransport } from 'nodemailer';
import { WatchOptions } from '../interfaces/watch-options.interface';

export async function notify(
  {
    watchConfig,
    summary,
  }: {
    watchConfig: WatchOptions;
    summary: string;
    details: unknown;
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
    requireTLS: true,
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
    text: `https://www.recreation.gov/camping/campgrounds/${watchConfig.campgroundId}`, // plain text body
  });

  console.log(`Message sent: ${info.messageId}`);
}
