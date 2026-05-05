FROM node:20-alpine

ENV NODE_ENV=development

# Sharp needs vips native library
RUN apk add --no-cache openssl vips-dev fftw-dev build-base

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY prisma ./prisma/
RUN node_modules/.bin/prisma generate

COPY . .

# Uploads stored in this volume-mounted directory
RUN mkdir -p /app/uploads

EXPOSE 3005

CMD ["npm", "run", "start:dev"]
