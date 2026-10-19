import { Subject } from '../academics/subject.model.js';
import { AcademicProgress } from '../academics/academicProgress.model.js';

export class RecommendationEngine {
  /**
   * Deterministic recommendation engine generating 3 to 5 actionable tasks
   * @param {Object} user - User document
   * @param {Object} summary - Pre-aggregated ProgressSummary document
   * @returns {Promise<Array>} 3 to 5 prioritized actionable recommendation items
   */
  static async getRecommendations(user, summary) {
    const recommendations = [];

    // Rule 1: Pending Academic Work in Current Semester
    try {
      const currentSemester = user.semester || 1;
      const query = { semester: currentSemester };
      if (user.branch) query.branch = user.branch;

      const semesterSubjects = await Subject.find(query).limit(5).lean();
      const progressList = await AcademicProgress.find({ userId: user._id }).lean();
      const progressMap = new Map(
        progressList.map(p => [p.subjectId.toString(), p.completedTopicIds || []])
      );

      for (const subject of semesterSubjects) {
        const completedIds = progressMap.get(subject._id.toString()) || [];
        const nextTopic = subject.topics?.find(t => !completedIds.includes(t.topicId));

        if (nextTopic) {
          recommendations.push({
            id: `rec-academic-${subject._id}-${nextTopic.topicId}`,
            type: 'academics',
            priority: 'high',
            badge: `${subject.code} • Sem ${currentSemester}`,
            title: `Study: ${nextTopic.title}`,
            description: `Next syllabus topic in ${subject.name}. Estimated reading: ${nextTopic.estimatedHours || 2}h.`,
            actionLabel: 'Open Syllabus',
            deepLink: `/academics?subjectId=${subject._id}&topicId=${nextTopic.topicId}`,
          });
          break; // Recommend highest priority subject topic
        }
      }
    } catch {
      // Continue rule evaluation
    }

    // Rule 2: Daily Coding / DSA Challenge
    const solvedCount = summary?.codingStats?.solvedCount || 0;
    const codingStreak = summary?.codingStats?.streak || 0;

    let targetDifficulty = 'Easy';
    if (solvedCount >= 10) targetDifficulty = 'Medium';
    if (solvedCount >= 40) targetDifficulty = 'Hard';

    recommendations.push({
      id: 'rec-coding-daily',
      type: 'coding',
      priority: 'high',
      badge: `DSA • ${targetDifficulty}`,
      title: `Daily Challenge: ${targetDifficulty === 'Easy' ? 'Two Sum & Array Hash' : 'LRU Cache & Graph Traversal'}`,
      description:
        codingStreak > 0
          ? `You have a ${codingStreak}-day coding streak active! Solve today's challenge to maintain momentum.`
          : 'Solve a curated problem today in the Monaco sandbox to boost your algorithmic problem solving.',
      actionLabel: 'Solve in Editor',
      deepLink: '/coding',
    });

    // Rule 3: GATE Weak Area or Practice Test
    const gateTests = summary?.gateStats?.testsAttempted || 0;
    const weakTopics = summary?.gateStats?.weakTopics || [];

    if (weakTopics.length > 0) {
      const topic = weakTopics[0];
      recommendations.push({
        id: 'rec-gate-weak-topic',
        type: 'gate',
        priority: 'medium',
        badge: 'GATE CS',
        title: `Revise Weak Topic: ${topic}`,
        description: `Your last test highlighted accuracy drops in ${topic}. Review PYQs and high-frequency formulas.`,
        actionLabel: 'Review Topic PYQs',
        deepLink: `/gate?topic=${encodeURIComponent(topic)}`,
      });
    } else {
      recommendations.push({
        id: 'rec-gate-mock',
        type: 'gate',
        priority: 'medium',
        badge: 'GATE Prep',
        title: gateTests === 0 ? 'Take your Diagnostic GATE Test' : 'Weekly Full GATE Mock Test',
        description:
          'Practice 65 questions under official negative marking conditions (+1/-0.33, +2/-0.66).',
        actionLabel: 'Start GATE Test',
        deepLink: '/gate',
      });
    }

    // Rule 4: AI Mock Interview Readiness
    const interviewCount = summary?.interviewStats?.sessionsCompleted || 0;
    const readinessScore = summary?.interviewStats?.averageReadinessScore || 0;

    if (interviewCount === 0 || readinessScore < 70) {
      recommendations.push({
        id: 'rec-interview-practice',
        type: 'interviews',
        priority: 'medium',
        badge: 'Placement Readiness',
        title: 'Complete an AI Technical Mock Interview',
        description:
          'Simulate a 15-minute engineering interview and receive instant rubric feedback on clarity and technical depth.',
        actionLabel: 'Launch Interview',
        deepLink: '/interviews',
      });
    }

    // Rule 5: User Goal Alignment
    if (user.goals && user.goals.length > 0 && recommendations.length < 5) {
      const topGoal = user.goals[0];
      recommendations.push({
        id: 'rec-goal-alignment',
        type: 'community',
        priority: 'low',
        badge: 'Career Goal',
        title: `Explore Senior Advice for: ${topGoal}`,
        description:
          'Connect with alumni mentors who landed roles matching your targeted career direction.',
        actionLabel: 'Ask a Senior',
        deepLink: '/community?tab=ask-senior',
      });
    }

    // Ensure strictly 3 to 5 recommendations are returned
    return recommendations.slice(0, 5);
  }
}

export default RecommendationEngine;
