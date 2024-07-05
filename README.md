# Garden Finance Bot

Discord BOT

## Active bots

### PROD

This is the bot active on [Garden's Discord server](https://discord.com/invite/Fp4ZmZZrFu)

Use this [bot invite](https://discord.com/api/oauth2/authorize?client_id=913903801033981952&permissions=2147560448&scope=bot) to add it to a Discord server.

### TEST
This is a test bot where new features should be deployed first before hitting production.


## Creating the bot

Out of the scope of this README, but in summary [something like this](https://www.writebots.com/discord-bot-token/) can show you the way.

## Setting up

1. Copy `.env.example` to `.env`.
2. Fill in the bot token you got when creating the bot in the previous step

## Running

### With Node

`npm start`

### With Docker

```bash
docker build . -t garden-bot
docker run -d --env-file .env garden-bot
```

To see the logs

```bash
# get the running CONTAINER ID
docker ps

docker logs <CONTAINER ID>
```

