import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MongoClient, type Collection } from "mongodb";

interface VerificationRecord {
  discord_id: string;
  discord_username: string;
  roblox_id: string;
  roblox_username: string;
  verified_at: string;
}

let cachedClient: MongoClient | null = null;
let indexesEnsured = false;

async function getCollection(): Promise<Collection<VerificationRecord>> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  const dbName = process.env.MONGODB_DB || "duncanville";
  const col = cachedClient.db(dbName).collection<VerificationRecord>("verifications");
  if (!indexesEnsured) {
    await col.createIndex({ discord_id: 1 }, { unique: true });
    await col.createIndex({ roblox_id: 1 });
    indexesEnsured = true;
  }
  return col;
}

function authOk(req: VercelRequest): boolean {
  const expected = process.env.MONGO_PROXY_TOKEN;
  if (!expected) return false;
  return req.headers.authorization === `Bearer ${expected}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!authOk(req)) return res.status(401).json({ error: "unauthorized" });

  try {
    const col = await getCollection();

    if (req.method === "GET") {
      const discordId = String(req.query.discord_id || "");
      if (!discordId) return res.status(400).json({ error: "discord_id required" });
      const doc = await col.findOne({ discord_id: discordId }, { projection: { _id: 0 } });
      if (!doc) return res.status(404).json({ error: "not found" });
      return res.status(200).json(doc);
    }

    if (req.method === "POST") {
      const body = req.body as VerificationRecord;
      const required = ["discord_id", "discord_username", "roblox_id", "roblox_username", "verified_at"];
      for (const k of required) {
        if (!body || typeof (body as Record<string, unknown>)[k] !== "string") {
          return res.status(400).json({ error: `${k} required` });
        }
      }
      await col.updateOne({ discord_id: body.discord_id }, { $set: body }, { upsert: true });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: (e as Error).message });
  }
}