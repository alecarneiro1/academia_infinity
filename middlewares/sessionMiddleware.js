const session = require("express-session");

const sessionMiddleware = session({
  name: process.env.COOKIE_NAME || "sid",
  secret: process.env.SESSION_SECRET || "troque-este-segredo",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
});

module.exports = sessionMiddleware;
