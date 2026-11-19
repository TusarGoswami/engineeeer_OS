import { Assessment } from '../modules/assessments/assessment.model.js';
import { AssessmentAttempt } from '../modules/assessments/assessmentAttempt.model.js';
import { MonitoringEvent } from '../modules/assessments/monitoringEvent.model.js';
import { CommunityPost } from '../modules/community/communityPost.model.js';
import { CommunityReply } from '../modules/community/communityReply.model.js';
import { GateTest } from '../modules/gate/gateTest.model.js';
import { Subject } from '../modules/academics/subject.model.js';
import { User } from '../modules/users/user.model.js';
import { logger } from '../config/logger.js';

export const seedAssessmentsAndCommunity = async () => {
  logger.info('[Seed] Seeding Proctored Assessments, Moderation Queue, Community & Extra GATE Tests...');

  const studentUser = await User.findOne({ role: 'student' });
  const seniorUser = await User.findOne({ role: 'senior' }) || studentUser;
  const adminUser = await User.findOne({ role: { $in: ['platformAdmin', 'contentAdmin'] } }) || seniorUser;

  const osSubject = await Subject.findOne({ name: /Operating Systems/i }) || await Subject.findOne();
  const dsaSubject = await Subject.findOne({ name: /Data Structures/i }) || osSubject;
  const dbmsSubject = await Subject.findOne({ name: /Database/i }) || osSubject;

  // 1. Proctored Assessments
  const existingAssessments = await Assessment.countDocuments();
  if (existingAssessments === 0) {
    const a1 = await Assessment.create({
      title: 'CS301: Operating Systems & Virtual Memory Midterm Examination',
      description: 'Official proctored examination covering CPU scheduling, paging algorithms, TLB reach, and deadlock prevention.',
      subjectId: osSubject?._id,
      durationMinutes: 45,
      totalMarks: 30,
      rules: {
        fullScreenRequired: true,
        trackTabSwitches: true,
      },
      isPublished: true,
      questions: [
        {
          questionId: 'q1',
          questionText: 'Which page replacement algorithm is known to suffer from Belady\'s Anomaly?',
          type: 'mcq',
          marks: 2,
          options: [
            { id: 'A', text: 'Least Recently Used (LRU)' },
            { id: 'B', text: 'First-In First-Out (FIFO)' },
            { id: 'C', text: 'Optimal Page Replacement (OPT)' },
            { id: 'D', text: 'Clock Page Replacement' },
          ],
          correctOptions: ['B'],
          explanation: 'FIFO page replacement can produce more page faults when allocated more frame capacity (Belady Anomaly).',
          topic: 'Virtual Memory',
        },
        {
          questionId: 'q2',
          questionText: 'Which of the following conditions are mandatory for a deadlock to exist? (Select all that apply)',
          type: 'msq',
          marks: 4,
          options: [
            { id: 'A', text: 'Mutual Exclusion' },
            { id: 'B', text: 'Hold and Wait' },
            { id: 'C', text: 'Preemption Allowed' },
            { id: 'D', text: 'Circular Wait' },
          ],
          correctOptions: ['A', 'B', 'D'],
          explanation: 'Coffman conditions: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.',
          topic: 'Deadlocks',
        },
        {
          questionId: 'q3',
          questionText: 'Consider a 32-bit virtual address architecture with 4 KB page size. If each page table entry takes 4 bytes, what is the size in Megabytes of a single linear 1-level page table?',
          type: 'nat',
          marks: 4,
          natRange: { min: 4, max: 4 },
          explanation: '4KB page = 2^12 bytes offset. Number of pages = 2^32 / 2^12 = 2^20. Page table size = 2^20 * 4 bytes = 4 MB.',
          topic: 'Memory Management',
        },
      ],
    });

    await Assessment.create({
      title: 'CS201: Data Structures, Heaps & Graph Algorithms Assessment',
      description: 'Comprehensive assessment on balanced trees (AVL/Red-Black), Binomial Heaps, and shortest path algorithms.',
      subjectId: dsaSubject?._id,
      durationMinutes: 60,
      totalMarks: 40,
      rules: {
        fullScreenRequired: true,
        trackTabSwitches: true,
      },
      isPublished: true,
      questions: [
        {
          questionId: 'q1',
          questionText: 'What is the worst-case time complexity of finding the shortest path between all pairs of vertices using the Floyd-Warshall algorithm?',
          type: 'mcq',
          marks: 2,
          options: [
            { id: 'A', text: 'O(V^2)' },
            { id: 'B', text: 'O(V^3)' },
            { id: 'C', text: 'O(V * E)' },
            { id: 'D', text: 'O(E log V)' },
          ],
          correctOptions: ['B'],
          explanation: 'Floyd-Warshall evaluates triple nested loops iterating through all vertices: O(V^3).',
          topic: 'Graphs',
        },
        {
          questionId: 'q2',
          questionText: 'In an AVL tree of height 5 (where single node tree has height 0), what is the minimum number of nodes required?',
          type: 'nat',
          marks: 4,
          natRange: { min: 20, max: 20 },
          explanation: 'Recurrence N(h) = N(h-1) + N(h-2) + 1. N(0)=1, N(1)=2, N(2)=4, N(3)=7, N(4)=12, N(5)=20.',
          topic: 'Trees',
        },
      ],
    });

    await Assessment.create({
      title: 'CS304: Database Systems & Transaction Isolation Proctored Test',
      description: 'Testing ACID consistency, serializability graphs, B+ Tree split operations, and SQL window functions.',
      subjectId: dbmsSubject?._id,
      durationMinutes: 45,
      totalMarks: 25,
      rules: {
        fullScreenRequired: true,
        trackTabSwitches: true,
      },
      isPublished: true,
      questions: [
        {
          questionId: 'q1',
          questionText: 'Which normal form guarantees the elimination of all transitive dependencies?',
          type: 'mcq',
          marks: 2,
          options: [
            { id: 'A', text: '1NF' },
            { id: 'B', text: '2NF' },
            { id: 'C', text: '3NF' },
            { id: 'D', text: 'BCNF' },
          ],
          correctOptions: ['C'],
          explanation: '3NF enforces that non-prime attributes are non-transitively dependent on candidate keys.',
          topic: 'Normalization',
        },
      ],
    });

    // 2. Seed a Flagged Assessment Attempt for the Faculty Integrity Queue
    if (studentUser) {
      const attempt = await AssessmentAttempt.create({
        assessmentId: a1._id,
        userId: studentUser._id,
        startedAt: new Date(Date.now() - 45 * 60 * 1000),
        expiresAt: new Date(Date.now() - 15 * 60 * 1000),
        submittedAt: new Date(Date.now() - 18 * 60 * 1000),
        status: 'submitted',
        isAutoSubmitted: false,
        score: 22,
        accuracyRate: 75,
        reviewSignalsCount: 3,
        isFlaggedForReview: true,
        facultyReview: {
          verdict: 'pending',
          penaltyMarks: 0,
          notes: '',
        },
        answers: [
          { questionId: 'q1', selectedOptions: ['B'], isCorrect: true, marksAwarded: 2 },
          { questionId: 'q2', selectedOptions: ['A', 'B'], isCorrect: false, marksAwarded: 0 },
        ],
      });

      // Add monitoring telemetry logs
      await MonitoringEvent.create([
        {
          attemptId: attempt._id,
          userId: studentUser._id,
          eventType: 'tab_hidden',
          metadata: { windowTitle: 'Google Search - Belady Anomaly', durationMs: 4200 },
          occurredAt: new Date(Date.now() - 35 * 60 * 1000),
        },
        {
          attemptId: attempt._id,
          userId: studentUser._id,
          eventType: 'window_blur',
          metadata: { targetWindow: 'External application' },
          occurredAt: new Date(Date.now() - 30 * 60 * 1000),
        },
        {
          attemptId: attempt._id,
          userId: studentUser._id,
          eventType: 'fullscreen_exit',
          metadata: { screenResolution: '1920x1080' },
          occurredAt: new Date(Date.now() - 25 * 60 * 1000),
        },
      ]);
    }

    logger.info('[Seed] Successfully seeded 3 proctored assessments and 1 flagged moderation attempt.');
  }

  // 3. Community Posts & Discussions
  const existingPosts = await CommunityPost.countDocuments();
  if (existingPosts === 0 && studentUser) {
    const post1 = await CommunityPost.create({
      authorId: studentUser._id,
      title: 'How should juniors prepare for distributed systems and LLD rounds at top tier product firms?',
      content: `I'm a 3rd year CSE student preparing for upcoming summer internships and off-campus full-time rounds.\n\nI have completed basic DSA (graphs, trees, DP), but I am looking for structured senior advice on:\n1. Recommended reading for distributed consensus: Raft vs Paxos.\n2. How deeply to study storage engine internals (LSM Trees vs B+ Trees) for entry-level SDE roles.\n3. Common Low-Level Design (LLD) interview patterns like Rate Limiters, Cache with TTL, and Notification Services.`,
      category: 'Placements',
      tags: ['placements', 'distributed-systems', 'lld', 'system-design'],
      isAskSenior: true,
      upvoteCount: 19,
      repliesCount: 2,
      isResolved: true,
    });

    const reply1 = await CommunityReply.create({
      postId: post1._id,
      authorId: seniorUser._id,
      content: `Great question! For entry-level SDE-1 rounds:\n\n1. **Consensus**: Understand the core failure modes of distributed systems (split-brain, network partitions). For Raft, know Leader Election and Log Replication at a high level.\n2. **Storage Engines**: Knowing when an LSM tree (append-only write optimized like RocksDB/Cassandra) wins over a B+ Tree (read optimized, in-place update like Postgres/InnoDB) is an immediate standout signal in technical rounds.\n3. **LLD**: Focus on SOLID principles, Singleton thread safety, Factory pattern, and Observer pattern. Implement an in-memory Key-Value store with TTL and an LRU Cache from scratch.`,
      upvoteCount: 14,
      isAccepted: true,
    });

    await CommunityPost.findByIdAndUpdate(post1._id, { acceptedReplyId: reply1._id });

    await CommunityPost.create({
      authorId: seniorUser._id,
      title: 'GATE CS 2027 Comprehensive Strategy: How to master Engineering Mathematics and Discrete Math',
      content: `Discrete Mathematics and Engineering Mathematics carry 25-28 marks combined in GATE CS. Here is my proven study order:\n\n1. **Propositional Logic**: Truth tables, first-order predicate calculus, and equivalences.\n2. **Set Theory & Relations**: Partial orders, lattices, equivalence relations, and Warshall algorithm.\n3. **Graph Theory**: Handshaking lemma, Euler tours, Hamiltonian graphs, planar graph bounds (e <= 3v - 6).\n4. **Linear Algebra & Probability**: Eigenvalues, rank of matrices, Bayes theorem, and Poisson distributions.\n\nSolve all previous 15 years GATE questions (PYQs) twice before attempting full-length tests.`,
      category: 'GATE Prep',
      tags: ['gate-prep', 'discrete-math', 'linear-algebra'],
      isAskSenior: false,
      upvoteCount: 24,
      repliesCount: 1,
    });

    await CommunityPost.create({
      authorId: studentUser._id,
      title: 'Real-world Database Normalization: Understanding when BCNF is better than 3NF',
      content: `While revising DBMS normalization, I noticed many textbooks say BCNF is strictly stronger than 3NF, but sometimes 3NF is preferred in practice because 3NF guarantees dependency preservation.\n\nCould any senior explain a real-world case where achieving BCNF loses functional dependency preservation, and how production systems handle this trade-off?`,
      category: 'Academics',
      tags: ['dbms', 'normalization', 'bcnf', 'sql'],
      isAskSenior: true,
      upvoteCount: 11,
      repliesCount: 0,
    });

    await CommunityPost.create({
      authorId: adminUser._id,
      title: 'Architecting High-Throughput Background Job Workers with BullMQ, Redis & Node.js',
      content: `In modern engineering systems like EngineerOS, long-running operations like code sandboxing (Judge0) and AI evaluation are offloaded to background worker queues.\n\nKey architectural pillars:\n- **Concurrency Isolation**: Separate queue instances per workload type.\n- **Idempotency Keys**: Ensure jobs never re-execute twice during transient redis reconnects.\n- **Dead Letter Queues (DLQ)**: Retain failed jobs with stack traces for automated retry or faculty audit.`,
      category: 'System Design',
      tags: ['nodejs', 'redis', 'bullmq', 'architecture'],
      isAskSenior: false,
      upvoteCount: 31,
      repliesCount: 0,
    });

    logger.info('[Seed] Successfully seeded 4 community discussions and senior replies.');
  }

  // 4. Additional GATE Mock Tests
  const gateCount = await GateTest.countDocuments();
  if (gateCount <= 1) {
    await GateTest.create({
      title: 'GATE CS 2026 — Algorithms & Data Structures Special Subject Mock',
      description: 'Focused high-yield mock test covering Divide & Conquer, Dynamic Programming, Greedy choice properties, and Tree traversals.',
      subject: 'Computer Science and Information Technology',
      durationMinutes: 90,
      totalMarks: 25,
      totalQuestions: 6,
      questions: [
        {
          questionId: 'q1',
          questionText: 'What is the number of undirected simple graphs possible with 5 labeled vertices that have exactly 4 edges?',
          type: 'nat',
          marks: 2,
          negativeMarks: 0,
          natRange: { min: 210, max: 210 },
          topic: 'Discrete Mathematics',
          explanation: 'With 5 vertices, total possible edges = 5C2 = 10. Number of graphs with exactly 4 edges = 10C4 = 210.',
        },
        {
          questionId: 'q2',
          questionText: 'Which of the following sorting algorithms have worst-case time complexity strictly less than O(n^2)? (Select all that apply)',
          type: 'msq',
          marks: 2,
          negativeMarks: 0,
          options: [
            { id: 'A', text: 'Merge Sort' },
            { id: 'B', text: 'Heap Sort' },
            { id: 'C', text: 'Quicksort' },
            { id: 'D', text: 'Insertion Sort' },
          ],
          correctOptions: ['A', 'B'],
          topic: 'Algorithms',
          explanation: 'Merge Sort and Heap Sort are guaranteed O(n log n) in worst case. Quicksort and Insertion Sort are O(n^2) worst case.',
        },
        {
          questionId: 'q3',
          questionText: 'A B+ tree of order 4 (max 4 pointers per internal node) has 3 levels. What is the maximum number of key values that can be stored in this tree?',
          type: 'nat',
          marks: 2,
          negativeMarks: 0,
          natRange: { min: 48, max: 48 },
          topic: 'Database Management Systems',
          explanation: 'Level 1: 1 node (max 4 pointers). Level 2: 4 nodes (max 4 pointers each = 16 leaf nodes). Level 3: 16 leaves, each with max 3 keys = 48 keys.',
        },
      ],
    });

    await GateTest.create({
      title: 'GATE CS 2026 — Systems Core: OS, Networks & Computer Architecture',
      description: 'System-level core examination testing CPU scheduling, TCP congestion window algorithms, and Cache associativity.',
      subject: 'Computer Science and Information Technology',
      durationMinutes: 90,
      totalMarks: 25,
      totalQuestions: 5,
      questions: [
        {
          questionId: 'q1',
          questionText: 'A computer system uses 4-way set associative cache of size 64 KB with cache block size 16 bytes. The physical address space is 4 GB (32-bit). How many bits are used for the Cache Tag field?',
          type: 'nat',
          marks: 2,
          negativeMarks: 0,
          natRange: { min: 18, max: 18 },
          topic: 'Computer Organization & Architecture',
          explanation: 'Block size = 16 bytes (4 offset bits). Number of blocks = 64KB / 16B = 4096 blocks. Number of sets = 4096 / 4 = 1024 sets (10 index bits). Tag bits = 32 - 10 - 4 = 18 bits.',
        },
        {
          questionId: 'q2',
          questionText: 'In TCP Tahoe, when a timeout occurs during slow start or congestion avoidance, what is the Congestion Window (cwnd) reset to?',
          type: 'mcq',
          marks: 1,
          negativeMarks: 0.33,
          options: [
            { id: 'A', text: 'Half of current cwnd' },
            { id: 'B', text: '1 Maximum Segment Size (1 MSS)' },
            { id: 'C', text: 'Slow Start Threshold (ssthresh)' },
            { id: 'D', text: 'Receiver Advertised Window' },
          ],
          correctOptions: ['B'],
          topic: 'Computer Networks',
          explanation: 'On timeout in TCP Tahoe, ssthresh is set to cwnd/2 and cwnd is reset to 1 MSS.',
        },
      ],
    });

    logger.info('[Seed] Successfully seeded 2 additional GATE CS mock tests.');
  }

  logger.info('✅ Assessments, Moderation Queue, Community & Extra GATE tests seeded successfully!');
};

export default seedAssessmentsAndCommunity;
