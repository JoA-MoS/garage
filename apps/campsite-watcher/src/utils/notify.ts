import nodemailer from 'nodemailer';
import { environment } from '../environments/environment';
import { WatchOptions } from '../interfaces/watch-options.interface';

export async function notify({
  watchConfig,
  summary,
}: {
  watchConfig: WatchOptions;
  summary: string;
  details: unknown;
}) {
  const transportOptions = {
    host: environment.smtp.host,
    port: environment.smtp.port,
    secure: environment.smtp.secure,
    auth: {
      user: environment.smtp.user,
      pass: environment.smtp.password, // generated ethereal password
    },
  };
  // console.log({ transportOptions });
  const transporter = nodemailer.createTransport(
    transportOptions as nodemailer.SendMailOptions
  );

  const info = await transporter.sendMail({
    from: environment.smtp.user,
    to: watchConfig.emails,
    subject: summary,
    text: `https://www.recreation.gov/camping/campgrounds/${watchConfig.campgroundId}`, // plain text body
  });

  console.log(`Message sent: ${info.messageId}`);
}
