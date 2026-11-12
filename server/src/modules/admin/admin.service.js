import { User } from '../users/user.model.js';
import { CodingProblem } from '../coding/codingProblem.model.js';
import { CodingTestCase } from '../coding/codingTestCase.model.js';
import { CodingSubmission } from '../coding/codingSubmission.model.js';
import { Assessment } from '../assessments/assessment.model.js';
import { AssessmentAttempt } from '../assessments/assessmentAttempt.model.js';
import { MonitoringEvent } from '../assessments/monitoringEvent.model.js';
import { UserBadge } from '../profile/userBadge.model.js';
import { ProfileSnapshotService } from '../profile/profileSnapshot.service.js';
import { NotFoundError, ConflictError } from '../../middleware/error.js';
import { logger } from '../../config/logger.js';

export class AdminService {
  /**
   * Get high-level system analytics for faculty/admin dashboard
   */
  static async getDashboardStats() {
    const [
      totalUsers,
      totalStudents,
      totalSeniors,
      totalAlumni,
      totalProblems,
      totalSubmissions,
      totalAssessments,
      totalAttempts,
      flaggedAttemptsCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'senior' }),
      User.countDocuments({ isAlumni: true }),
      CodingProblem.countDocuments(),
      CodingSubmission.countDocuments(),
      Assessment.countDocuments(),
      AssessmentAttempt.countDocuments(),
      AssessmentAttempt.countDocuments({ isFlaggedForReview: true, 'facultyReview.verdict': 'pending' }),
    ]);

    return {
      users: {
        total: totalUsers,
        students: totalStudents,
        seniors: totalSeniors,
        alumni: totalAlumni,
      },
      coding: {
        problems: totalProblems,
        submissions: totalSubmissions,
      },
      assessments: {
        total: totalAssessments,
        attempts: totalAttempts,
        pendingReviewFlags: flaggedAttemptsCount,
      },
    };
  }

  // ==========================================
  // Coding Problem Management
  // ==========================================

  static async getProblems({ page = 1, limit = 20, search = '', difficulty = '' } = {}) {
    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    if (difficulty) {
      filter.difficulty = difficulty;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [problems, total] = await Promise.all([
      CodingProblem.find(filter)
        // Sort newest problems first for faculty oversight
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CodingProblem.countDocuments(filter),
    ]);

    // Attach test case count per problem
    const problemIds = problems.map((p) => p._id);
    const testCaseCounts = await CodingTestCase.aggregate([
      { $match: { problemId: { $in: problemIds } } },
      { $group: { _id: '$problemId', count: { $sum: 1 } } },
    ]);
    const countsMap = new Map(testCaseCounts.map((t) => [t._id.toString(), t.count]));

    const enriched = problems.map((p) => ({
      ...p,
      testCaseCount: countsMap.get(p._id.toString()) || 0,
    }));

    return {
      problems: enriched,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  static async getProblemById(id) {
    const problem = await CodingProblem.findById(id).lean();
    if (!problem) throw new NotFoundError('Coding problem not found');

    const testCases = await CodingTestCase.find({ problemId: id }).sort({ order: 1 }).lean();
    return { ...problem, testCases };
  }

  static async createProblem(data) {
    const existing = await CodingProblem.findOne({ slug: data.slug });
    if (existing) throw new ConflictError(`Problem with slug '${data.slug}' already exists`);

    const problem = await CodingProblem.create(data);
    logger.info({ problemId: problem._id, title: problem.title }, '[Admin] Created coding problem');
    return problem;
  }

  static async updateProblem(id, data) {
    if (data.slug) {
      const existing = await CodingProblem.findOne({ slug: data.slug, _id: { $ne: id } });
      if (existing) throw new ConflictError(`Slug '${data.slug}' is already taken by another problem`);
    }

    const problem = await CodingProblem.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    if (!problem) throw new NotFoundError('Coding problem not found');

    logger.info({ problemId: problem._id }, '[Admin] Updated coding problem');
    return problem;
  }

  static async deleteProblem(id) {
    const problem = await CodingProblem.findByIdAndDelete(id);
    if (!problem) throw new NotFoundError('Coding problem not found');

    await CodingTestCase.deleteMany({ problemId: id });
    logger.info({ problemId: id }, '[Admin] Deleted coding problem and associated test cases');
    return { success: true, message: 'Problem and test cases deleted' };
  }

  static async addTestCase(problemId, testCaseData) {
    const problem = await CodingProblem.findById(problemId);
    if (!problem) throw new NotFoundError('Coding problem not found');

    const testCase = await CodingTestCase.create({
      ...testCaseData,
      problemId,
    });

    return testCase;
  }

  static async deleteTestCase(testCaseId) {
    const testCase = await CodingTestCase.findByIdAndDelete(testCaseId);
    if (!testCase) throw new NotFoundError('Test case not found');
    return { success: true, message: 'Test case deleted' };
  }

  // ==========================================
  // Assessment Creator & Scheduler
  // ==========================================

  static async getAssessments({ page = 1, limit = 20, search = '' } = {}) {
    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [assessments, total] = await Promise.all([
      Assessment.find(filter)
        .populate('subjectId', 'name code semester branch')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Assessment.countDocuments(filter),
    ]);

    // Attach attempt stats
    const assessmentIds = assessments.map((a) => a._id);
    const attemptStats = await AssessmentAttempt.aggregate([
      { $match: { assessmentId: { $in: assessmentIds } } },
      {
        $group: {
          _id: '$assessmentId',
          totalAttempts: { $sum: 1 },
          flaggedCount: { $sum: { $cond: ['$isFlaggedForReview', 1, 0] } },
          avgScore: { $avg: '$score' },
        },
      },
    ]);

    const statsMap = new Map(attemptStats.map((s) => [s._id.toString(), s]));

    const enriched = assessments.map((a) => ({
      ...a,
      stats: statsMap.get(a._id.toString()) || { totalAttempts: 0, flaggedCount: 0, avgScore: 0 },
    }));

    return {
      assessments: enriched,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  static async createAssessment(data) {
    // If questions were provided with correct answers, ensure questionsCount matches
    const assessmentData = {
      ...data,
      questionsCount: data.questions?.length || 0,
    };

    const assessment = await Assessment.create(assessmentData);
    logger.info({ assessmentId: assessment._id, title: assessment.title }, '[Admin] Created assessment');
    return assessment;
  }

  static async updateAssessment(id, data) {
    if (data.questions) {
      data.questionsCount = data.questions.length;
    }

    const assessment = await Assessment.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    if (!assessment) throw new NotFoundError('Assessment not found');
    return assessment;
  }

  static async deleteAssessment(id) {
    const assessment = await Assessment.findByIdAndDelete(id);
    if (!assessment) throw new NotFoundError('Assessment not found');
    return { success: true, message: 'Assessment deleted' };
  }

  // ==========================================
  // Student Integrity Moderation Queue
  // ==========================================

  static async getIntegritySignals({ page = 1, limit = 20, assessmentId, verdict = 'pending' } = {}) {
    const filter = {
      $or: [
        { isFlaggedForReview: true },
        { reviewSignalsCount: { $gt: 0 } },
      ],
    };

    if (assessmentId) filter.assessmentId = assessmentId;
    if (verdict && verdict !== 'all') {
      filter['facultyReview.verdict'] = verdict;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [attempts, total] = await Promise.all([
      AssessmentAttempt.find(filter)
        .populate('userId', 'name email username university branch role avatarKey')
        .populate('assessmentId', 'title totalMarks durationMinutes')
        .sort({ reviewSignalsCount: -1, updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AssessmentAttempt.countDocuments(filter),
    ]);

    // Attach the most recent monitoring events per attempt
    const attemptIds = attempts.map((a) => a._id);
    const events = await MonitoringEvent.find({ attemptId: { $in: attemptIds } })
      .sort({ occurredAt: -1 })
      .limit(200)
      .lean();

    const eventsMap = new Map();
    events.forEach((ev) => {
      const key = ev.attemptId.toString();
      if (!eventsMap.has(key)) eventsMap.set(key, []);
      eventsMap.get(key).push(ev);
    });

    const enriched = attempts.map((att) => ({
      ...att,
      events: eventsMap.get(att._id.toString()) || [],
    }));

    return {
      attempts: enriched,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  static async resolveIntegrityVerdict(attemptId, { action, penaltyMarks = 0, notes = '' }, reviewerId) {
    const attempt = await AssessmentAttempt.findById(attemptId);
    if (!attempt) throw new NotFoundError('Assessment attempt not found');

    let updatedScore = attempt.score;
    if (action === 'penalize') {
      updatedScore = Math.max(0, attempt.score - Number(penaltyMarks));
    } else if (action === 'void') {
      updatedScore = 0;
    }

    attempt.facultyReview = {
      verdict: action,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      penaltyMarks: action === 'penalize' ? Number(penaltyMarks) : 0,
      notes,
    };

    if (action === 'approve') {
      attempt.isFlaggedForReview = false;
    }

    attempt.score = updatedScore;
    await attempt.save();

    logger.info({ attemptId, action, reviewerId }, '[Admin] Resolved integrity verdict');
    return attempt;
  }

  // ==========================================
  // User Management & Verified Alumni Badges
  // ==========================================

  static async getUsers({ page = 1, limit = 20, search = '', role = '', isAlumni } = {}) {
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (typeof isAlumni === 'boolean' || isAlumni === 'true' || isAlumni === 'false') {
      filter.isAlumni = isAlumni === true || isAlumni === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email username role isAlumni university branch semester profile avatarKey createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  static async updateUserRole(userId, newRole) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    user.role = newRole;
    await user.save();

    await ProfileSnapshotService.rebuildSnapshot(userId);
    logger.info({ userId, newRole }, '[Admin] Updated user role');
    return user;
  }

  static async verifyAlumniStatus(userId, { isAlumni, currentCompany = '', graduationYear = null }) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    user.isAlumni = Boolean(isAlumni);
    if (!user.profile) user.profile = {};

    if (currentCompany) user.profile.currentCompany = currentCompany;
    if (graduationYear) user.profile.graduationYear = Number(graduationYear);

    // If verified as alumni, promote role to senior if currently a student
    if (user.isAlumni && user.role === 'student') {
      user.role = 'senior';
    }

    await user.save();

    // Award or revoke verified alumni badge
    if (user.isAlumni) {
      await UserBadge.findOneAndUpdate(
        { userId: user._id, badgeId: 'alumni_verified' },
        {
          $setOnInsert: {
            userId: user._id,
            badgeId: 'alumni_verified',
            name: 'Verified Alumni Mentor',
            description: 'Officially verified alumni engineer offering mentorship and guidance',
            icon: '🎖️',
            tier: 'gold',
            category: 'community',
            earnedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
    } else {
      await UserBadge.deleteOne({ userId: user._id, badgeId: 'alumni_verified' });
    }

    await ProfileSnapshotService.rebuildSnapshot(userId);
    logger.info({ userId, isAlumni: user.isAlumni }, '[Admin] Updated alumni status & badges');

    return user;
  }
}

export default AdminService;
