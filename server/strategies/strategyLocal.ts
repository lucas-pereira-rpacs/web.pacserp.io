import bcrypt from 'bcrypt';
import { Strategy as LocalStrategy } from 'passport-local';
import { UserModel } from '#models/user';

const strategyLocal = new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await UserModel.findOne({ email: email.trim().toLowerCase() }).select(
        '+passwordHash',
      );

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        done(null, false, { message: 'Invalid email or password' });
        return;
      }

      done(null, user);
    } catch (error) {
      done(error);
    }
  },
);

export default strategyLocal;
