import { ProfileSnapshot } from './profileSnapshot.model.js';
import { UserBadge } from './userBadge.model.js';
import { DailyActivity } from '../progress/dailyActivity.model.js';
import { User } from '../users/user.model.js';

export class ProfileRepository {
  static async findSnapshotByUserId(userId) {
    return ProfileSnapshot.findOne({ userId }).lean();
  }

  static async findSnapshotByUsername(username) {
    return ProfileSnapshot.findOne({ username: username.toLowerCase() }).lean();
  }

  static async findUserById(userId) {
    return User.findById(userId).lean();
  }

  static async findUserByUsername(username) {
    return User.findOne({ username: username.toLowerCase() }).lean();
  }

  static async findUserByShareToken(shareToken) {
    return User.findOne({ 'profileSettings.shareToken': shareToken }).lean();
  }

  static async updateUser(userId, data) {
    return User.findByIdAndUpdate(userId, { $set: data }, { new: true, runValidators: true }).lean();
  }

  static async findBadgesByUserId(userId) {
    return UserBadge.find({ userId }).sort({ earnedAt: -1 }).lean();
  }

  static async findDailyActivityByUserId(userId, limit = 365) {
    return DailyActivity.find({ userId }).sort({ date: -1 }).limit(limit).lean();
  }
}

export default ProfileRepository;

