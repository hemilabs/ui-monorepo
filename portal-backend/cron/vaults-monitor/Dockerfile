FROM node:24-alpine

ENV NODE_ENV=production

RUN npm install --global npm@11

WORKDIR /app

COPY package*.json .
RUN npm install --omit=dev

USER node

COPY . .

CMD ["npm", "start"]
