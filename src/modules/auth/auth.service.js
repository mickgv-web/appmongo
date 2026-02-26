import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "./auth.model.js";

export async function registerUser(email, password) {
  const hash = await bcrypt.hash(password, 10);

  return User.create({
    email,
    passwordHash: hash
  });
}

export async function loginUser(email, password) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return token;
}