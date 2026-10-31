import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
      minlength: 3,
      maxlength: 30,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never return in default queries
    },
    role: {
      type: String,
      enum: ['student', 'senior', 'contentAdmin', 'platformAdmin'],
      default: 'student',
      index: true,
    },
    isAlumni: {
      type: Boolean,
      default: false,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    headline: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    university: {
      type: String,
      default: '',
      trim: true,
    },
    branch: {
      type: String,
      default: '',
      trim: true,
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
      default: 1,
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500,
    },
    avatarKey: {
      type: String,
      default: '',
    },
    avatarVersion: {
      type: Number,
      default: 1,
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true,
    },
    profile: {
      avatarUrl: { type: String, default: '' },
      githubHandle: { type: String, default: '' },
      linkedinUrl: { type: String, default: '' },
      graduationYear: { type: Number },
      currentCompany: { type: String, default: '' },
    },
    profileSettings: {
      visibility: {
        type: String,
        enum: ['private', 'unlisted', 'public'],
        default: 'private',
        index: true,
      },
      shareToken: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
        default: () => crypto.randomBytes(16).toString('hex'),
      },
      theme: {
        type: String,
        enum: ['terminal', 'minimalist', 'silicon', 'varsity', 'brutal'],
        default: 'terminal',
      },
      sections: {
        showHeatmap: { type: Boolean, default: true },
        showGate: { type: Boolean, default: true },
        showInterviews: { type: Boolean, default: true },
        showUniversity: { type: Boolean, default: true },
        showPhoto: { type: Boolean, default: true },
        showSkills: { type: Boolean, default: true },
        showBadges: { type: Boolean, default: true },
      },
    },
    goals: {
      type: [String],
      default: ['Master DSA', 'Ace Semester Exams', 'Crack GATE / Placements'],
    },
    settings: {
      theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
      emailNotifications: { type: Boolean, default: true },
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
userSchema.index({ role: 1, university: 1 });
userSchema.index({ isAlumni: 1, branch: 1 });
userSchema.index({ 'profileSettings.visibility': 1, username: 1 });

export const User = mongoose.model('User', userSchema);
export default User;
