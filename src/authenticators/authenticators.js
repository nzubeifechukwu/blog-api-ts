import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

import prisma from "../lib/prisma.js";

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

function serializeSession(user, done) {
  done(null, user.id);
}

async function deserializeSession(id, done) {
  try {
    const user = await prisma.user.findUnique({ where: { id: id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
}

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: `${process.env.SECRET}`,
};

const jwtStrategy = new JwtStrategy(jwtOptions, async (payload, done) => {
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
