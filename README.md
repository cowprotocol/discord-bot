# Robot Cow Bot

Discord BOT

- [PROD bot invite](https://discord.com/api/oauth2/authorize?client_id=913903801033981952&permissions=2147560448&scope=bot)
- [TEST bot invite](https://discord.com/api/oauth2/authorize?client_id=976075945293266984&permissions=2147560448&scope=bot)

## Required env vars

**BOT_TOKEN**: Discord bot token

## Running

### With Node

`yarn start`

### With Docker

```bash
$ docker build . -t robot-cow-bot
$ docker run --env BOT_TOKEN='the bot token' -d robot-cow-bot
```

To see the logs

```bash
$ docker logs $(docker ps)
```

### With Heroku

Install `heroku` cli and run:

`heroku local`

## Deploying

### Heroku

⚠️ Deprecated. We are moving to a self hosting solution.
