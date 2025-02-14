FROM node:20.18.3-alpine

ENV NODE_ENV production

WORKDIR /app

COPY package*.json .
RUN npm install --production

USER node

COPY . .

CMD npm run refresh-prices
