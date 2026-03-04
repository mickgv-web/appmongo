import { handleSearch } from "./search.service.js";

export async function search(req, res) {
  const { q, mode } = req.query;

  if (!q) {
    return res.status(400).json({ message: "Query is required" });
  }

  const result = await handleSearch(q, { mode });

  res.json(result);
}