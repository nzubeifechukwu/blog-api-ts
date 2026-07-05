import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  VerifiedCallback,
} from "passport-jwt";
import { User as PrismaUser } from "@prisma/client";

import prisma from "../lib/prisma.js";

// Extend Express User interface so req.user maps cleanly across the app
export type SafeUser = Omit<PrismaUser, "password">; // Omit password field globally
declare global {
  namespace Express {
    interface User extends SafeUser {}
  }
}

interface JwtPayload {
  userId: number;
  iat?: number;
  exp?: number;
}

const localStrategy = new LocalStrategy(
  { usernameField: "email", passwordField: "password" },
  async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email: email } });
      if (!user) {
        return done(null, false, {
          message: "Incorrect email and/or password.",
        });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, {
          message: "Incorrect email and/or password.",
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  },
);

function serializeSession(
  user: Express.User | PrismaUser,
  done: (err: any, id?: number) => void,
) {
  done(null, user.id);
}

async function deserializeSession(
  id: number,
  done: (err: any, user?: PrismaUser | null) => void,
) {
  try {
    const user = await prisma.user.findUnique({ where: { id: id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
}

const secretKey = process.env.SECRET;
if (!secretKey) {
  throw new Error(
    "FATAL: JWT secret key missing from environment configuration.",
  );
}

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secretKey,
};

const jwtStrategy = new JwtStrategy(jwtOptions, async (payload: JwtPayload, done: VerifiedCallback) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
});

export { localStrategy, serializeSession, deserializeSession, jwtStrategy };
