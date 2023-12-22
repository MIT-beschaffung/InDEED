FROM node:17.3-alpine3.14 As development

RUN apk add curl
RUN apk add jq


WORKDIR /usr/src/app

COPY ./backend/package*.json ./
COPY ./backend .

RUN npm install glob rimraf --legacy-peer-deps

RUN npm install --only=development

RUN npm run build

FROM node:17.3-alpine3.14 as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY backend/package*.json ./
COPY ./backend .

RUN npm install --only=production --legacy-peer-deps

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]