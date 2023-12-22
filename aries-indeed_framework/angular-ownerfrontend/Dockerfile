FROM node:14.15.5-alpine

RUN apk add curl

ENV PATH /app/node_modules/.bin:$PATH

WORKDIR /app

# install app dependencies
COPY package.json ./
COPY package-lock.json ./

# add app
COPY . ./

RUN npm install

# start app
CMD ["ng","serve","--host", "0.0.0.0", "--disable-host-check"]
