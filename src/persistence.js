import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

import loggerFn from "./utils/logger.js";

const logger = loggerFn("persistence");

const fsp = fs.promises;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Persistence {
  DATA_FILE = path.join(__dirname, "data.rdb");

  constructor() {
    if (Persistence.instance) {
      return Persistence.instance;
    }

    Persistence.instance = this;

    this.store = {};
    this.expirationTimes = {};
  }

  async saveSnapshot() {
    const data = JSON.stringify({
      store: this.store,
      expirationTimes: this.expirationTimes,
    });

    try {
      await fsp.writeFile(this.DATA_FILE, data);
      logger.info(`Snapshot saved to ${this.DATA_FILE}`);
    } catch (error) {
      logger.error(`Error saving snapshot: ${error.message}`);
    }
  }

  loadSnapshotSync() {
    if (!fs.existsSync(this.DATA_FILE)) return;

    try {
      const data = fs.readFileSync(this.DATA_FILE).toString();
      if (!data) return;

      const { store: loadedStore, expirationTimes: loadedExpirationTimes } =
        JSON.parse(data);

      Object.assign(this.store, loadedStore);
      Object.assign(this.expirationTimes, loadedExpirationTimes);

      logger.info(`Snapshot loaded from ${this.DATA_FILE}`);
    } catch (error) {
      logger.error(`Error loading snapshot: ${error.message}`);
    }
  }
}

export const persistence = new Persistence();
