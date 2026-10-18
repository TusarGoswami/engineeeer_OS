export class GateScoringService {
  /**
   * Evaluate complete GATE attempt against official GATE marking schemes
   * @param {Array} testQuestions - Full questions array with correct answers & marks
   * @param {Array} studentAnswers - Student's submitted answers
   */
  static evaluateAttempt(testQuestions, studentAnswers) {
    const answerMap = new Map(studentAnswers.map(a => [a.questionId, a]));
    const topicStats = new Map(); // topic -> { total, correct, score }

    let totalScore = 0;
    let totalMarksAvailable = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    const evaluatedAnswers = [];

    for (const q of testQuestions) {
      totalMarksAvailable += q.marks;

      if (!topicStats.has(q.topic)) {
        topicStats.set(q.topic, { total: 0, correct: 0, score: 0 });
      }
      const tStat = topicStats.get(q.topic);
      tStat.total += 1;

      const subAnswer = answerMap.get(q.questionId);
      const hasAnswered =
        (subAnswer?.selectedOptions && subAnswer.selectedOptions.length > 0) ||
        (subAnswer?.natAnswer !== null && subAnswer?.natAnswer !== undefined);

      if (!hasAnswered) {
        unattemptedCount++;
        evaluatedAnswers.push({
          questionId: q.questionId,
          selectedOptions: [],
          natAnswer: null,
          isCorrect: false,
          marksAwarded: 0,
          negativeDeducted: 0,
        });
        continue;
      }

      let isCorrect = false;
      let marksAwarded = 0;
      let negativeDeducted = 0;

      // Evaluation by Question Type
      if (q.type === 'mcq') {
        const studentChoice = subAnswer.selectedOptions[0];
        const correctChoice = q.correctOptions[0];

        if (studentChoice === correctChoice) {
          isCorrect = true;
          marksAwarded = q.marks;
        } else {
          isCorrect = false;
          negativeDeducted = q.marks === 1 ? 0.33 : 0.66;
        }
      } else if (q.type === 'msq') {
        // MSQ: Exact set match, zero partial marks, zero negative marks
        const studentSet = new Set(subAnswer.selectedOptions || []);
        const correctSet = new Set(q.correctOptions || []);

        const isExactMatch =
          studentSet.size === correctSet.size && [...studentSet].every(opt => correctSet.has(opt));

        if (isExactMatch) {
          isCorrect = true;
          marksAwarded = q.marks;
        } else {
          isCorrect = false;
          marksAwarded = 0;
          negativeDeducted = 0;
        }
      } else if (q.type === 'nat') {
        // NAT: Numerical within acceptable range
        const numAnswer = Number(subAnswer.natAnswer);
        const min =
          q.natRange?.min !== undefined && q.natRange?.min !== null ? q.natRange.min : null;
        const max =
          q.natRange?.max !== undefined && q.natRange?.max !== null ? q.natRange.max : null;

        if (min !== null && max !== null) {
          isCorrect = numAnswer >= min && numAnswer <= max;
        } else if (q.correctOptions && q.correctOptions[0]) {
          isCorrect = Math.abs(numAnswer - Number(q.correctOptions[0])) <= 0.01;
        }

        if (isCorrect) {
          marksAwarded = q.marks;
        } else {
          negativeDeducted = 0; // No negative marking in NAT
        }
      }

      const netDelta = marksAwarded - negativeDeducted;
      totalScore += netDelta;

      if (isCorrect) {
        correctCount++;
        tStat.correct += 1;
      } else {
        incorrectCount++;
      }
      tStat.score += netDelta;

      evaluatedAnswers.push({
        questionId: q.questionId,
        selectedOptions: subAnswer.selectedOptions || [],
        natAnswer: subAnswer.natAnswer ?? null,
        isCorrect,
        marksAwarded,
        negativeDeducted,
      });
    }

    // Generate topic breakdown and identify weak topics (< 50% accuracy)
    const topicBreakdown = [];
    const weakTopics = [];

    for (const [topic, stats] of topicStats.entries()) {
      const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      topicBreakdown.push({
        topic,
        total: stats.total,
        correct: stats.correct,
        accuracy,
      });

      if (accuracy < 50) {
        weakTopics.push(topic);
      }
    }

    const attemptedTotal = correctCount + incorrectCount;
    const overallAccuracy =
      attemptedTotal > 0 ? Math.round((correctCount / attemptedTotal) * 100) : 0;

    return {
      score: Math.max(0, Math.round(totalScore * 100) / 100),
      totalMarksAvailable,
      totalQuestions: testQuestions.length,
      correctCount,
      incorrectCount,
      unattemptedCount,
      accuracyRate: overallAccuracy,
      topicBreakdown,
      weakTopics,
      evaluatedAnswers,
    };
  }
}

export default GateScoringService;
