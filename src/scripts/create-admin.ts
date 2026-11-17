// Creates the first administrator (or promotes an existing account).
// Usage: npm run create-admin -- <email> <password> [name]
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User";

async function main() {
  const [userEmail, password, userName = "Administrator"] =
    process.argv.slice(2);
  if (!userEmail || !password || password.length < 6) {
    console.error(
      "Usage: npm run create-admin -- <email> <password (6+ chars)> [name]"
    );
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI || "");
  const email = userEmail.trim().toLowerCase();
  const existing = await User.findOne({ userEmail: email });

  if (existing) {
    existing.role = "admin";
    await existing.save();
    console.log(`Promoted ${email} to admin.`);
  } else {
    await User.create({
      userName,
      userEmail: email,
      password: await bcrypt.hash(password, 10),
      role: "admin",
    });
    console.log(`Created admin ${email}.`);
  }
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
