FROM node:16-alpine

WORKDIR /opt/app

COPY package.json package-lock.json ./

RUN npm install

COPY index.mjs .

CMD ["node", "index.mjs"]
