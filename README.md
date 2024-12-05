# Rivals 2 Elo Bot

A Discord bot for Rivals of Aether II that maps user's Discord accounts to their
ELO and Rank, allowing for leaderboard and player card image generation,
optional appending to nicknames (of non-admin accounts - Discord permissions
restricts this!), and more.

### How it works

- The Discord bot (`/bot`) lives in AWS via Elastic Beanstalk, as it's the web
  service tier that needs to be always available.
- The compute tier (`/functions`) live in AWS as individual Lambda functions,
  and is reserved for image generation and manipulation, parsing multiple Steam
  leaderboard XML pages, and any other misc. compute tasks.
- The /`shared` folder contains interfaces for TypeScript typing and a set of
  utility functions for tasks such as cleaning hex code, resolving Steam URL's
  into their SteamID64's, and most importantly, interacting with the tables in
  AWS DynamoDB (see `TABLES.md`).

### Getting up and running

- For the bot, run the start task in the root dir (`deno task start`)
- For re-registering commands (i.e. adding a new one, modifying parameters), the `deploy` task is defined.

### Why Deno?

Deno 2.0 recently released, and I wanted to check it out for a few reasons:

- I wanted a linter and formatter built into my CLI.
- Deno workspaces and deno.json's are a joy to use, and extremely readable.
- No cryptic tsconfig.json issues.
- It comes with a VSCode extension and highlights issues quickly (and my
  previous linter would stop working out of nowhere).
- It slightly outcompetes Bun in common benchmarks (see
  [this image](https://deno.com/blog/v2.0/deno-perf-charts-3x3.png), taken from
  their announcement blog).
