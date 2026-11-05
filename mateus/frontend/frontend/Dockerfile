FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@11.25.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG VITE_API_BASE_URL=/backend
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN pnpm build
FROM nginx:stable-alpine
ENV API_UPSTREAM=host.docker.internal:8080
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]