const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const models = require("../models").default;
const db = require("../middleware/db");
// ---------- Passport Jwt Strategy ----------
const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};
const strategy = new JwtStrategy(options, (payload, done) => {
  findUser(payload.userId)
    .then((user) => {
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    })
    .catch((e) => {
      console.log('options :>> ', e.message);
      return done(e, false);
    });
});

async function findUser(userId) {
  const getUser = await db.findById(userId, models.User);
  if (getUser) {
    return getUser;
  } else {
    return null;
  }
}

module.exports = (passport) => {
  passport.use(strategy);
};
