const sqlite3 = require('sqlite3').verbose();
const config = require('./config');

class WeatherSystem {
  constructor() {
    this.db = new sqlite3.Database(config.GARDEN_DB_PATH);
    this.initDatabase();
    this.weatherTypes = ['☀️', '🌧️', '🌪️', '⛈️', '🌫️', '🌈'];
    this.weatherEffects = {
      '☀️': 'Plants grow 20% faster',
      '🌧️': 'Double seed earnings, 10% slower growth',
      '🌪️': '15% faster growth, small chance of losing seeds',
      '⛈️': 'High risk, high reward day',
      '🌫️': 'Hidden bonuses',
      '🌈': 'Rare event: special rewards!'
    };
  }

  initDatabase() {
    this.db.run(`CREATE TABLE IF NOT EXISTS weather_forecast (
      day INTEGER PRIMARY KEY,
      weather TEXT,
      timestamp INTEGER
    )`);
  }

  async generateForecast() {
    const now = Date.now();
    const day = Math.floor(now / 86400000); // Current day number

    for (let i = 0; i < 4; i++) { // Generate for today + 3 days
      const weather = this.weatherTypes[Math.floor(Math.random() * this.weatherTypes.length)];
      const timestamp = now + i * 86400000; // Add i days worth of milliseconds

      await this.updateForecast(day + i, weather, timestamp);
    }
  }

  async updateForecast(day, weather, timestamp) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "INSERT OR REPLACE INTO weather_forecast (day, weather, timestamp) VALUES (?, ?, ?)",
        [day, weather, timestamp],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  async getForecast() {
    const now = Date.now();
    const currentDay = Math.floor(now / 86400000);

    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM weather_forecast WHERE day >= ? ORDER BY day LIMIT 4",
        [currentDay],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  async getCurrentWeather() {
    const forecast = await this.getForecast();
    return forecast[0];
  }

  getWeatherEffect(weather) {
    return this.weatherEffects[weather] || 'No special effects';
  }

  async checkAndUpdateForecast() {
    const forecast = await this.getForecast();
    if (forecast.length < 4) {
      await this.generateForecast();
    } else {
      const now = Date.now();
      if (now > forecast[0].timestamp + 86400000) {
        // More than a day has passed, generate a new day's forecast
        await this.generateForecast();
      }
    }
  }
}

module.exports = new WeatherSystem();