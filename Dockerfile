# docker build -t rivals2-elobot . && docker run -it -p 1993:1993 rivals2-elobot
FROM denoland/deno:2.1.3
EXPOSE 1993
WORKDIR /app

RUN mkdir -p /usr/share/fonts/truetype/coolvetica \
    && mkdir -p /home/deno/.cache/fontconfig \
    && chown -R deno:deno /home/deno/.cache/fontconfig

COPY ./fonts/coolvetica/*.otf /usr/share/fonts/truetype/coolvetica/

RUN apt-get update && apt-get install -y \
    fontconfig

USER deno
RUN fc-cache -fv

COPY . .
RUN deno cache ./bot/main.ts

CMD ["task", "start"]