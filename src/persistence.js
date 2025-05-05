import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

import loggerFn from "./utils/logger.js";
import { config } from "./config.js";
import { executeCommand } from "./core.js";

const logger = loggerFn("persistence");

const fsp = fs.promises;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Persistence {
  DATA_FILE = path.join(__dirname, "data.rdb");
  AOF_FILE = path.join(__dirname, "data.aof");

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

  async appendAof(command, args) {
    let aofLog = `${command} ${args.join(" ")}\r\n`;

    try {
      await fsp.appendFile(this.AOF_FILE, aofLog);
      logger.info(`AOF log appended: ${aofLog.trim()}`);
    } catch (error) {
      logger.error(`Error appending AOF log: ${error.message}`);
    }
  }

  replayAofSync() {
    if (!config.appendOnly || !fs.existsSync(this.AOF_FILE)) return;

    try {
      const data = fs.readFileSync(this.AOF_FILE).toString();
      if (!data) return;

      const logs = data.split("\r\n").filter(Boolean);

      logger.info(`Replaying AOF log from ${this.AOF_FILE}`);

      for (const log of logs) {
        const [command, ...args] = log.split(" ");
        executeCommand(command, args, true);
      }
    } catch (error) {
      logger.error(`Error replaying AOF log: ${error.message}`);
    }
  }
}

export const persistence = new Persistence();
