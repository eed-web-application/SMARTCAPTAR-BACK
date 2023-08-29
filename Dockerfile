FROM node:lts-alpine

WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY . . 
EXPOSE 1337
CMD ["node","index.js"]
