import { registerUser, loginUser } from "./auth.service.js";

export async function register(req, res) {
  try {
    await registerUser(req.body.email, req.body.password);
    res.status(201).json({ message: "User created" });
  } catch {
    res.status(400).json({ message: "Email already exists" });
  }
}

export async function login(req, res) {
  try {
    const token = await loginUser(req.body.email, req.body.password);
    res.json({ token });
  } catch {
    res.status(401).json({ message: "Invalid credentials" });
  }
}