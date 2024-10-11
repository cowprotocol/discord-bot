const sqlite3 = require('sqlite3').verbose();
const config = require('./config');
const Twit = require('twit');

const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

class GardenSystem {
  constructor() {
    this.db = new sqlite3.Database(config.GARDEN_DB_PATH);
    this.initDatabase();
  }

  initDatabase() {
    this.db.serialize(() => {
      // Create gardens table
      this.db.run(`CREATE TABLE IF NOT EXISTS gardens (
        user_id TEXT PRIMARY KEY,
        seedlings INTEGER DEFAULT 0,
        sprouts INTEGER DEFAULT 0,
        flowers INTEGER DEFAULT 0,
        trees INTEGER DEFAULT 0,
        gardener_level INTEGER DEFAULT 1
      )`);

      // Create user_activity table with next_scavenge_time
      this.db.run(`CREATE TABLE IF NOT EXISTS user_activity (
        user_id TEXT PRIMARY KEY,
        last_scavenge INTEGER,
        next_scavenge_time INTEGER
      )`);

      // Create weather table
      this.db.run(`CREATE TABLE IF NOT EXISTS weather (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        current_weather TEXT,
        last_change INTEGER
      )`);

      // Create twitter_links table
      this.db.run(`CREATE TABLE IF NOT EXISTS twitter_links (
        discord_id TEXT PRIMARY KEY,
        twitter_id TEXT,
        last_check INTEGER
      )`);
    });

    console.log('Database initialized');
  }

  async getGarden(userId) {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM gardens WHERE user_id = ?", [userId], (err, row) => {
        if (err) reject(err);
        resolve(row || { user_id: userId, seedlings: 0, sprouts: 0, flowers: 0, trees: 0, gardener_level: 1 });
      });
    });
  }

  async updateGarden(userId, updates) {
    const garden = await this.getGarden(userId);
    const newGarden = { ...garden, ...updates };

    return new Promise((resolve, reject) => {
      this.db.run(
        "INSERT OR REPLACE INTO gardens (user_id, seedlings, sprouts, flowers, trees, gardener_level) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, newGarden.seedlings, newGarden.sprouts, newGarden.flowers, newGarden.trees, newGarden.gardener_level],
        (err) => {
          if (err) reject(err);
          resolve(newGarden);
        }
      );
    });
  }

  async addSeedlings(userId, amount) {
    const garden = await this.getGarden(userId);
    return this.updateGarden(userId, { seedlings: garden.seedlings + amount });
  }

  async scavengeForSeedlings(userId) {
    const now = Date.now();
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM user_activity WHERE user_id = ?", [userId], async (err, row) => {
        if (err) reject(err);
        if (!row || now >= row.next_scavenge_time) {
          const seedlingsFound = Math.floor(Math.random() * 5) + 1; // Random number between 1 and 5
          await this.addSeedlings(userId, seedlingsFound);
          const nextScavengeTime = now + 24 * 60 * 60 * 1000; // 24 hours from now
          this.db.run("INSERT OR REPLACE INTO user_activity (user_id, last_scavenge, next_scavenge_time) VALUES (?, ?, ?)", 
            [userId, now, nextScavengeTime]);
          resolve({ seedlingsFound, nextScavengeTime });
        } else {
          resolve({ seedlingsFound: 0, nextScavengeTime: row.next_scavenge_time });
        }
      });
    });
  }

  async giftSeedlings(fromUserId, toUserId, amount) {
    const fromGarden = await this.getGarden(fromUserId);
    if (fromGarden.seedlings < amount) {
      return false; // Not enough seedlings to gift
    }

    await this.updateGarden(fromUserId, { seedlings: fromGarden.seedlings - amount });
    await this.addSeedlings(toUserId, amount);
    return true;
  }

  async getCurrentWeather() {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM weather WHERE id = 1", (err, row) => {
        if (err) reject(err);
        if (row) {
          resolve(row.current_weather);
        } else {
          this.updateWeather();
          resolve(config.WEATHER_TYPES[0]); // Default to first weather type
        }
      });
    });
  }

  async updateWeather() {
    const newWeather = config.WEATHER_TYPES[Math.floor(Math.random() * config.WEATHER_TYPES.length)];
    const now = Date.now();

    return new Promise((resolve, reject) => {
      this.db.run(
        "INSERT OR REPLACE INTO weather (id, current_weather, last_change) VALUES (1, ?, ?)",
        [newWeather, now],
        (err) => {
          if (err) reject(err);
          resolve(newWeather);
        }
      );
    });
  }

  async plantSeedling(userId) {
    const garden = await this.getGarden(userId);
    if (garden.seedlings < 1) {
      return false; // Not enough seedlings to plant
    }

    const weather = await this.getCurrentWeather();
    let growthChance = 0.7; // Base 70% chance to grow

    // Adjust growth chance based on weather
    switch(weather) {
      case '☀️': growthChance += 0.1; break; // Sunny weather increases growth chance
      case '🌧️': growthChance += 0.2; break; // Rainy weather greatly increases growth chance
      case '🌪️': growthChance -= 0.2; break; // Windy weather decreases growth chance
      // Add more weather effects as needed
    }

    const growth = Math.random() < growthChance;

    if (growth) {
      await this.updateGarden(userId, { 
        seedlings: garden.seedlings - 1,
        sprouts: garden.sprouts + 1
      });
      return 'sprout';
    } else {
      await this.updateGarden(userId, { seedlings: garden.seedlings - 1 });
      return 'failed';
    }
  }

  async linkTwitterAccount(discordId, twitterHandle) {
    return new Promise((resolve, reject) => {
      T.get('users/show', { screen_name: twitterHandle }, (err, data, response) => {
        if (err) {
          reject(err);
        } else {
          this.db.run(
            "INSERT OR REPLACE INTO twitter_links (discord_id, twitter_id, last_check) VALUES (?, ?, ?)",
            [discordId, data.id_str, Date.now()],
            (err) => {
              if (err) reject(err);
              else resolve(data.id_str);
            }
          );
        }
      });
    });
  }

  async checkTwitterEngagement(discordId) {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM twitter_links WHERE discord_id = ?", [discordId], async (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(0); // No linked Twitter account
        } else {
          const now = Date.now();
          const targetAccounts = config.TARGET_TWITTER_ACCOUNTS;
          let engagementCount = 0;

          for (let account of targetAccounts) {
            const tweets = await this.getTweets(account, row.last_check);
            engagementCount += await this.checkUserEngagement(row.twitter_id, tweets);
          }

          this.db.run("UPDATE twitter_links SET last_check = ? WHERE discord_id = ?", [now, discordId]);

          const seedlingsEarned = engagementCount * config.SEEDLINGS_PER_ENGAGEMENT;
          await this.addSeedlings(discordId, seedlingsEarned);
          resolve(seedlingsEarned);
        }
      });
    });
  }

  async getTweets(accountId, sinceTime) {
    return new Promise((resolve, reject) => {
      T.get('statuses/user_timeline', { user_id: accountId, since: new Date(sinceTime).toISOString() }, (err, data, response) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async checkUserEngagement(userId, tweets) {
    let engagementCount = 0;
    for (let tweet of tweets) {
      if (tweet.entities.user_mentions.some(mention => mention.id_str === userId)) engagementCount++;
      if (tweet.retweeted_status && tweet.retweeted_status.user.id_str === userId) engagementCount++;
    }
    return engagementCount;
  }
}

module.exports = new GardenSystem();