import { mainAgent } from "../agents/mainAgent"
import type { NextApiRequest, NextApiResponse } from "next"

// This file is kept for reference but not used in App Router
// The actual API route is at /app/api/agent/route.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { input } = req.body
    const result = await mainAgent(input)
    res.status(200).json(result)
  } catch (err) {
    res.status(500).json({ error: "Agent error" })
  }
}

