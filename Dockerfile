FROM node:20.11

# Copy all files to the working directory
COPY . ./run

# Create app directory
WORKDIR /run

# Clean yarn cache and install dependencies
RUN yarn cache clean && yarn install --network-timeout 1000000000
#
## Build the app
RUN yarn build
#
## Install 'serve' globally to serve the static files
#RUN npm install -g serve

# Start the app with 'serve'
CMD ["yarn", "start"]
