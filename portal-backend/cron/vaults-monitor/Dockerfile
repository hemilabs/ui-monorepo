FROM node:24.14.0-alpine3.23

ENV NODE_ENV=production

RUN npm install --global npm@11.12.0

WORKDIR /app

COPY package*.json .
RUN npm install --omit=dev

USER node

COPY . .

CMD ["npm", "start"]
