import {
  checkAvailability,
  notify,
  WatchOptions,
} from '@garage/campsite-watcher-core';
import { getWatcherConfig } from './app/read-config';
import { environment } from './environments/environment';

// pass the watcher list via config param
(async () => {
  // reload watcher list every interval
  let watchers = await getWatcherConfig();
  await checkAllWatchers(watchers);
  setInterval(async () => {
    watchers = await getWatcherConfig();
    await checkAllWatchers(watchers);
  }, 15 * 60 * 1000);
})().catch((err) => console.error(err));

async function checkAllWatchers(watchConfigs: WatchOptions[]) {
  try {
    const result = await Promise.all(
      watchConfigs.map((v) => checkAvailability(v))
    );
    result.forEach((r) => {
      console.log(new Date().toISOString());
      console.log(r.summary);
      if (r.details.length > 0) {
        console.table(r.details);
        const transportOptions = {
          host: environment.smtp.host,
          port: Number(environment.smtp.port),
          secure: Boolean(environment.smtp.secure),
          auth: {
            user: environment.smtp.user,
            pass: environment.smtp.password, // generated ethereal password
          },
        };
        notify(r, transportOptions);
      }
    });
  } catch (err) {
    console.log(new Date().toISOString());
    console.error(err);
  }
}
