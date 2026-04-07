import mongoose from "mongoose";

import { env } from "./env";

let isConnected = false;

export async function connectDatabase() {
  if (isConnected) {
    return mongoose.connection;
  }

  await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 10,
  });
  isConnected = true;
  return mongoose.connection;
}

export async function disconnectDatabase() {
  if (!isConnected) {
    return;
  }

  await mongoose.disconnect();
  isConnected = false;
}
