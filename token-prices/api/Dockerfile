FROM node:20.18.3-alpine

ENV NODE_ENV=production
<<<<<<< Updated upstream

# Fix the cross-spawn vulnerability in the preinstalled npm version
RUN npm i --global npm@10.9.1
=======
>>>>>>> Stashed changes

WORKDIR /app

COPY package*.json .
RUN npm install --production

USER node

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
