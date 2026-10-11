import mongoose from 'mongoose';

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
    profile: {
      avatarUrl: { type: String, default: '' },
      githubHandle: { type: String, default: '' },
      linkedinUrl: { type: String, default: '' },
      graduationYear: { type: Number },
      currentCompany: { type: String, default: '' },
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

// Compound indexes as specified in docs/INDEXES.md
userSchema.index({ role: 1, university: 1 });
userSchema.index({ isAlumni: 1, branch: 1 });

export const User = mongoose.model('User', userSchema);
export default User;
