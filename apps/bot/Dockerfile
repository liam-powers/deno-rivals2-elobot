# docker build -t rivals2-elobot . && docker run -it -p 1993:1993 rivals2-elobot
FROM denoland/deno:latest
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

# Switch back to root to copy files
USER root
COPY . .
# Change ownership of all files to deno user
RUN chown -R deno:deno /app
# Switch back to deno user
USER deno

RUN deno cache ./main.ts

CMD ["task", "start"]