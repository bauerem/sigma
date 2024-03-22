FROM node:16.13.0

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Bundle app source
COPY . .

#npm has some dependency issues, but yarn does not work at all
RUN npm install

EXPOSE 8080

CMD [ "node", "server.js" ]

