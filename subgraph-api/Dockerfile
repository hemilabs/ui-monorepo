FROM node:22.20.0-alpine3.22

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json .
RUN npm install --production

USER node

COPY . .

EXPOSE 3003

CMD ["npm", "start"]
