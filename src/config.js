export const config = {
  snapshot: false,
  snapshotInterval: 5000,
  appendOnly: true,
  aofCommands: [
    "SET",
    "DEL",
    "EXPIRE",
    "INCR",
    "DECR",
    "LPUSH",
    "RPUSH",
    "LPOP",
    "RPOP",
  ],
};
