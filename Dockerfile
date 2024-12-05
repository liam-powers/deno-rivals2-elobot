FROM denoland/deno:2.1.2

WORKDIR /app

COPY . .

CMD ["task", "start"]
