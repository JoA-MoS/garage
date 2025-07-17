FROM node:24-alpine AS build

ENV NODE_ENV production

# USE a BUILD arg to specify the app_name and then this will be generic dockerfile for all apps

# Enable corepack for package manager
RUN corepack enable

WORKDIR /usr/app
COPY --chown=node:node ./dist/apps/campsite-watcher .
COPY --chown=node:node ./pnpm-lock.yaml ./pnpm-lock.yaml
COPY --chown=node:node ./package.json ./package.json
RUN pnpm install --frozen-lockfile --ignore-scripts --prod

USER node
CMD ["node", "main.js"]
