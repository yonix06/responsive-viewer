FROM node:lts-alpine AS deps
ENV NODE_ENV=development
WORKDIR /usr/src/app
COPY . .
# COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --silent
# && mv node_modules ../
FROM deps AS builder
ENV NODE_ENV=development
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app ./
ENV NODE_ENV=production
RUN npm run build

FROM builder AS runner

WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/build ./build
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/package-lock.json ./package-lock.json
COPY --from=builder /usr/src/app/public ./public
# RUN chown -R node /usr/src/app
EXPOSE 3000
# USER node
CMD ["npm", "run", "start:local"]
