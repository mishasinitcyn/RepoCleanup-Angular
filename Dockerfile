FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

ARG FAST_API_URL
ARG API_URL
ARG GITHUB_CLIENT_ID
ARG GITHUB_REDIRECT_URI

RUN cp src/environments/environment.prod.template.ts src/environments/environment.ts && \
    sed -i 's|${FAST_API_URL}|'${FAST_API_URL}'|g; s|${API_URL}|'${API_URL}'|g; s|${GITHUB_CLIENT_ID}|'${GITHUB_CLIENT_ID}'|g; s|${GITHUB_REDIRECT_URI}|'${GITHUB_REDIRECT_URI}'|g' src/environments/environment.ts

RUN echo "API_URL:" && echo ${API_URL}
RUN echo "Contents of environment.ts:" && cat src/environments/environment.ts

ENV NODE_ENV=production
RUN npm run build
EXPOSE 3000

CMD ["sh", "-c", "FAST_API_URL=$FAST_API_URL API_URL=$API_URL GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID GITHUB_REDIRECT_URI=$GITHUB_REDIRECT_URI npm run serve:ssr:repo-cleanup"]