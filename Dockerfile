FROM node:22 AS build
WORKDIR /app

RUN apt-get update && apt-get install -y qpdf && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22 AS prod
WORKDIR /app

RUN apt-get update && apt-get install -y qpdf && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules

RUN mkdir -p /app/cache

EXPOSE 3000
CMD [ "node", "dist/index.js" ]