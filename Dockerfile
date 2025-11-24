FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable

COPY pnpm*.yaml package*.json ./
RUN pnpm fetch

FROM base AS build

COPY . .

RUN pnpm install
RUN pnpm run build

FROM base AS runner

RUN pnpm install --prod

RUN mkdir ./storage
COPY drizzle/ ./drizzle
COPY drizzle.config.ts ./
COPY entrypoint.sh ./
COPY --from=build /app/build ./build

EXPOSE 3000

CMD ["sh", "./entrypoint.sh"]
