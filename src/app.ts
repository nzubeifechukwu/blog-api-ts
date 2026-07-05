import "dotenv/config";
import express from "express";
import session from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import passport from "passport";
import cors from "cors";

import prisma from "./lib/prisma.js";
import router from "./routes/router.js";
import {
  localStrategy,
  serializeSession,
  deserializeSession,
  jwtStrategy,
} from "./authenticators/authenticators.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = 10000; // Render uses port 10000

app.use(cors());
app.use(express.json());

app.use(
  session({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week in milliseconds
    },
    secret: `${process.env.SECRET}`,
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, // 2 minutes in milliseconds
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  }),
);

app.use(passport.session());

passport.use(localStrategy);
passport.use(jwtStrategy);
passport.serializeUser(serializeSession);
passport.deserializeUser(deserializeSession);

app.use("/", router);
app.use(errorHandler);

app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }
  console.log(`App listening on port ${PORT}`);
});
