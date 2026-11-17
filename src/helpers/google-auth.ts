import crypto from "crypto";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import User, { IUser } from "../models/User";

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
};

export class GoogleAuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

let client: OAuth2Client | null = null;

// Checks the ID token's signature, expiry, issuer and audience with Google's
// official library, then returns the verified identity.
export async function verifyGoogleCredential(
  credential: string
): Promise<GoogleProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new GoogleAuthError("Google sign-in is not configured", 503);
  }
  client ??= new OAuth2Client(clientId);

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new GoogleAuthError("Google sign-in could not be verified", 401);
  }

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    throw new GoogleAuthError(
      "Your Google account email must be verified to sign in",
      401
    );
  }

  return {
    googleId: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: payload.name?.trim() || payload.email.split("@")[0]!,
    ...(payload.picture ? { picture: payload.picture } : {}),
  };
}

async function availableUserName(base: string) {
  const name = base.slice(0, 70) || "Learner";
  if (!(await User.exists({ userName: name }))) return name;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${name} ${crypto.randomInt(1000, 9999)}`;
    if (!(await User.exists({ userName: candidate }))) return candidate;
  }
  return `${name} ${crypto.randomUUID().slice(0, 8)}`;
}

// Signs in the account linked to this Google identity. Falls back to an
// existing account with the same (Google-verified) email and links it;
// otherwise creates a new student account.
export async function findOrCreateGoogleUser(
  profile: GoogleProfile
): Promise<IUser> {
  const linked = await User.findOne({ googleId: profile.googleId });
  if (linked) return linked;

  const existing = await User.findOne({
    userEmail: { $in: [profile.email, new RegExp(`^${escapeRegex(profile.email)}$`, "i")] },
  });
  if (existing) {
    existing.googleId = profile.googleId;
    if (!existing.profileImage && profile.picture) {
      existing.profileImage = profile.picture;
    }
    await existing.save();
    return existing;
  }

  // Google users have no password; store an unusable random one so the
  // required field is satisfied. They can still set one via password reset.
  return User.create({
    userName: await availableUserName(profile.name),
    userEmail: profile.email,
    password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
    role: "user",
    googleId: profile.googleId,
    profileImage: profile.picture ?? "",
  });
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
