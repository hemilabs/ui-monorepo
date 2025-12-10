FROM node:24.11.1-alpine3.23

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json .
RUN npm install --production

USER node

COPY . .

EXPOSE 3003

CMD ["npm", "start"]
