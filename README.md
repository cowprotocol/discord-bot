# Robot Cow Bot

Discord BOT

## Active bots

### PROD

This is the bot active on [CowSwap's Discord server](chat.cowswap.exchange)

Use this [bot invite](https://discord.com/api/oauth2/authorize?client_id=913903801033981952&permissions=2147560448&scope=bot) to add it to a Discord server.

### TEST

This is a test bot where new features should be deployed first before hitting production.

Currently running on a private test server named `Robot Cow testing grounds`. [Here's a server invite](https://discord.gg/8t94Zwgm) (which has an expiration date, so you more likely to find it via the search)

Use this [bot invite](https://discord.com/api/oauth2/authorize?client_id=976075945293266984&permissions=2147560448&scope=bot) to add it to a Discord server.

## Creating the bot

Out of the scope of this README, but in summary [something like this](https://www.writebots.com/discord-bot-token/) can show you the way.

## Required env vars

**BOT_TOKEN**: Discord bot token

## Running

### With Node

`yarn start`

### With Docker

```bash
docker build . -t robot-cow-bot
docker run --env BOT_TOKEN='the bot token' -d robot-cow-bot
```

To see the logs

```bash
# get the running CONTAINER ID
docker ps

docker logs <CONTAINER ID>
```

### With Heroku

Install `heroku` cli and run:

`heroku local`

## Deploying

### Heroku

⚠️ Deprecated. We are moving to a self hosting solution.
