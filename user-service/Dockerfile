FROM node:20-alpine

ENV NODE_ENV=development

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY prisma ./prisma/
RUN node_modules/.bin/prisma generate

COPY . .

EXPOSE 3002

CMD ["npm", "run", "start:dev"]
