const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.trim().toLowerCase();
      if (!email) {
        return done(null, false, { message: "Google account has no email address" });
      }

      let user = await User.findOne({ googleId: profile.id });
      if (user) {
        return done(null, user);
      }

      user = await User.findOne({ email });
      if (user) {
        user.googleId = profile.id;
        user.authProvider = user.authProvider || "google";
        user.photo = user.photo || profile.photos?.[0]?.value;
        await user.save();
        return done(null, user);
      }

      user = await User.create({
        googleId: profile.id,
        name: profile.displayName || email.split("@")[0],
        email,
        photo: profile.photos?.[0]?.value,
        authProvider: "google",
      });

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

module.exports = passport;
