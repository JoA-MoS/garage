FROM node:16-alpine AS build

ENV NODE_ENV production

# USE a BUILD arg to specify the app_name and then this will be generic dockerfile for all apps

WORKDIR /usr/app
COPY --chown=node:node ./dist/apps/campsite-watcher .
COPY --chown=node:node ./package-lock.json ./package-lock.json
RUN npm ci --ignore-scripts --omit=dev

USER node
CMD ["npm", "start"]
