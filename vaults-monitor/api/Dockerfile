FROM node:20.18.3-alpine

ENV NODE_ENV=production

# Fix the cross-spawn vulnerability in the preinstalled npm version
RUN npm i --global npm@10.9.1

WORKDIR /app

COPY package*.json .
RUN npm install --production

USER node

COPY . .

EXPOSE 3004

CMD ["npm", "start"]
