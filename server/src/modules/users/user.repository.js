import { User } from './user.model.js';

export class UserRepository {
  static async findById(id) {
    return User.findById(id).lean();
  }

  static async findByIdWithPassword(id) {
    return User.findById(id).select('+passwordHash');
  }

  static async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() }).lean();
  }

  static async findByEmailWithPassword(email) {
    return User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  }

  static async create(userData) {
    return User.create(userData);
  }

  static async updateById(id, updateData) {
    return User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();
  }

  static async deleteById(id) {
    return User.findByIdAndDelete(id).lean();
  }

  static async incrementFailedAttempts(id) {
    const user = await User.findById(id);
    if (!user) return null;

    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    // Lockout after 5 attempts for 15 minutes
    if (user.failedLoginAttempts >= 5) {
      user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await user.save();
    return user;
  }

  static async resetFailedAttempts(id) {
    return User.findByIdAndUpdate(id, {
      $set: { failedLoginAttempts: 0, lockoutUntil: null },
    });
  }
}

export default UserRepository;
