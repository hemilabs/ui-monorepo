FROM node:24.13.1-alpine3.23

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json .
RUN npm install --omit=dev

USER node

COPY . .

CMD ["npm", "start"]
