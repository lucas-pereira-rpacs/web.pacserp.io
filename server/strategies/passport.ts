import passport from 'passport';
import { Feature } from '#enumerators/feature';
import isFeatureEnabled from '#gateways/isFeatureEnabled';
import { UserModel, type UserDocument } from '#models/user';
import strategyLocal from '#strategies/strategyLocal';

passport.use(strategyLocal);

passport.serializeUser((user, done) => {
  done(null, (user as UserDocument).id);
});

passport.deserializeUser<string>(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    if ((await isFeatureEnabled(Feature.Email)) && !user?.isVerified) {
      done(null, false);
      return;
    }
    done(null, user ?? false);
  } catch (error) {
    done(error);
  }
});

export default passport;
