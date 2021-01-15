# This file is a template, and might need editing before it works on your project.
FROM node:latest

WORKDIR /usr/src/app

COPY . /usr/src/app
RUN npm install

# replace this with your application's default port
EXPOSE 3000
CMD [ "node", "app.js" ]