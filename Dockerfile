FROM node:alpine

WORKDIR /app

# Copy package.json and yarn.lock
COPY package*.json yarn.lock ./

# Install dependencies
RUN apk add --no-cache --virtual .build-deps alpine-sdk python3 \
    && yarn install --frozen-lockfile \
    && apk del .build-deps

# Copy the rest of the application
COPY . .

# Set permissions (if needed)
RUN chmod -R 755 .

# Start the application
CMD ["yarn", "start"]