import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../modules/users/user.model.js';
import { Subject } from '../modules/academics/subject.model.js';
import { AcademicResource } from '../modules/academics/academicResource.model.js';
import { PasswordService } from '../modules/auth/password.service.js';
import { ProgressSummary } from '../modules/progress/progressSummary.model.js';
import { seedProblems } from './seedProblems.js';
import { seedGate } from './seedGate.js';
import { logger } from '../config/logger.js';

const UNIVERSITIES = ['MIT', 'IIT'];
const BRANCHES = [
  'Computer Science and Engineering',
  'Electronics and Communication',
  'Mechanical Engineering',
];

// Curated subjects across all 8 semesters for each branch
const SUBJECT_TEMPLATES = {
  'Computer Science and Engineering': [
    {
      sem: 1,
      code: 'CS101',
      name: 'Introduction to Programming in C',
      credits: 4,
      topics: [
        'Variables & Data Types',
        'Control Flow & Loops',
        'Functions & Pointers',
        'Structures & Unions',
        'File Handling',
      ],
    },
    {
      sem: 2,
      code: 'CS102',
      name: 'Data Structures and Algorithms',
      credits: 4,
      topics: [
        'Arrays & Strings',
        'Linked Lists',
        'Stacks & Queues',
        'Binary Trees & BST',
        'Sorting & Searching',
      ],
    },
    {
      sem: 3,
      code: 'CS201',
      name: 'Discrete Mathematical Structures',
      credits: 4,
      topics: [
        'Propositional Logic',
        'Set Theory & Relations',
        'Combinatorics',
        'Graph Theory',
        'Recurrence Relations',
      ],
    },
    {
      sem: 3,
      code: 'CS202',
      name: 'Digital Logic and Microprocessors',
      credits: 4,
      topics: [
        'Boolean Algebra',
        'Combinational Circuits',
        'Sequential Circuits',
        '8085/8086 Architecture',
        'Memory Interfacing',
      ],
    },
    {
      sem: 4,
      code: 'CS203',
      name: 'Design and Analysis of Algorithms',
      credits: 4,
      topics: [
        'Asymptotic Analysis',
        'Divide & Conquer',
        'Greedy Algorithms',
        'Dynamic Programming',
        'NP-Completeness',
      ],
    },
    {
      sem: 4,
      code: 'CS204',
      name: 'Theory of Computation',
      credits: 4,
      topics: [
        'Finite Automata & Regular Expressions',
        'Context-Free Grammars',
        'Pushdown Automata',
        'Turing Machines',
        'Decidability',
      ],
    },
    {
      sem: 5,
      code: 'CS301',
      name: 'Database Management Systems',
      credits: 4,
      topics: [
        'ER Modeling',
        'Relational Algebra & SQL',
        'Normalization (1NF-BCNF)',
        'Transaction Management & ACID',
        'Indexing & B+ Trees',
      ],
    },
    {
      sem: 5,
      code: 'CS302',
      name: 'Operating Systems',
      credits: 4,
      topics: [
        'Processes & Threads',
        'CPU Scheduling Algorithms',
        'Process Synchronization & Semaphores',
        'Deadlocks',
        'Virtual Memory & Paging',
      ],
    },
    {
      sem: 6,
      code: 'CS303',
      name: 'Computer Networks',
      credits: 4,
      topics: [
        'OSI & TCP/IP Stack',
        'Data Link Layer & Framing',
        'Network Layer & Routing (BGP, OSPF)',
        'Transport Layer (TCP, UDP)',
        'Application Protocols (HTTP, DNS)',
      ],
    },
    {
      sem: 6,
      code: 'CS304',
      name: 'Compiler Design',
      credits: 4,
      topics: [
        'Lexical Analysis',
        'Parsing (LL, LR, LALR)',
        'Syntax Directed Translation',
        'Intermediate Code Generation',
        'Code Optimization',
      ],
    },
    {
      sem: 7,
      code: 'CS401',
      name: 'Artificial Intelligence and Machine Learning',
      credits: 4,
      topics: [
        'Informed Search (A*)',
        'Linear & Logistic Regression',
        'Decision Trees & Random Forests',
        'Neural Networks & Backprop',
        'Model Evaluation & Overfitting',
      ],
    },
    {
      sem: 7,
      code: 'CS402',
      name: 'Cloud Computing and Distributed Systems',
      credits: 3,
      topics: [
        'Virtualization & Containers',
        'Distributed Consensus (Raft/Paxos)',
        'MapReduce & Big Data',
        'Serverless Architecture',
        'Cloud Security',
      ],
    },
    {
      sem: 8,
      code: 'CS403',
      name: 'Software Engineering & Capstone Design',
      credits: 6,
      topics: [
        'Agile & Scrum Methodologies',
        'System Architecture & Design Patterns',
        'CI/CD Pipelines',
        'Quality Assurance & Testing',
        'Production Deployment',
      ],
    },
  ],
  'Electronics and Communication': [
    {
      sem: 1,
      code: 'EC101',
      name: 'Basic Electrical and Electronics Engineering',
      credits: 4,
      topics: [
        'Ohm’s & Kirchhoff’s Laws',
        'Diodes & Transistors',
        'Operational Amplifiers',
        'AC Circuit Analysis',
      ],
    },
    {
      sem: 2,
      code: 'EC102',
      name: 'Electronic Devices and Circuit Theory',
      credits: 4,
      topics: [
        'Semiconductor Physics',
        'BJT & MOSFET Characteristics',
        'Biasing & Small Signal Models',
        'Frequency Response',
      ],
    },
    {
      sem: 3,
      code: 'EC201',
      name: 'Signals and Systems',
      credits: 4,
      topics: [
        'Continuous & Discrete Time Signals',
        'LTI Systems & Convolution',
        'Fourier Analysis',
        'Laplace & Z-Transform',
      ],
    },
    {
      sem: 4,
      code: 'EC202',
      name: 'Analog Communication',
      credits: 4,
      topics: [
        'Amplitude Modulation',
        'Frequency & Phase Modulation',
        'Superheterodyne Receivers',
        'Noise Analysis in Receivers',
      ],
    },
    {
      sem: 5,
      code: 'EC301',
      name: 'Digital Signal Processing',
      credits: 4,
      topics: [
        'DFT & FFT Algorithms',
        'FIR Filter Design',
        'IIR Filter Design',
        'Finite Word Length Effects',
      ],
    },
    {
      sem: 6,
      code: 'EC302',
      name: 'Electromagnetics and Waveguides',
      credits: 4,
      topics: [
        'Maxwell’s Equations',
        'Plane Wave Propagation',
        'Transmission Lines',
        'Waveguides & Antennas',
      ],
    },
    {
      sem: 7,
      code: 'EC401',
      name: 'VLSI Design and Embedded Systems',
      credits: 4,
      topics: [
        'CMOS Inverters',
        'Combinational MOS Logic',
        'Verilog HDL Modeling',
        'FPGA Architecture',
      ],
    },
    {
      sem: 8,
      code: 'EC402',
      name: 'Wireless and Optical Communication',
      credits: 4,
      topics: [
        'Cellular Concepts & Handoff',
        'MIMO & OFDM',
        'Optical Fibers & Dispersion',
        '5G Architectures',
      ],
    },
  ],
  'Mechanical Engineering': [
    {
      sem: 1,
      code: 'ME101',
      name: 'Engineering Mechanics',
      credits: 4,
      topics: [
        'Force Systems & Equilibrium',
        'Trusses & Frames',
        'Centroids & Friction',
        'Kinematics & Dynamics of Particles',
      ],
    },
    {
      sem: 2,
      code: 'ME102',
      name: 'Thermodynamics',
      credits: 4,
      topics: [
        'First & Second Laws of Thermodynamics',
        'Entropy',
        'Gas Power Cycles (Otto, Diesel)',
        'Pure Substance Properties',
      ],
    },
    {
      sem: 3,
      code: 'ME201',
      name: 'Mechanics of Solids',
      credits: 4,
      topics: [
        'Stress & Strain Relations',
        'Shear Force & Bending Moment',
        'Torsion of Circular Shafts',
        'Deflection of Beams',
      ],
    },
    {
      sem: 4,
      code: 'ME202',
      name: 'Fluid Mechanics and Machinery',
      credits: 4,
      topics: [
        'Fluid Statics & Bernoulli’s Equation',
        'Boundary Layer Theory',
        'Pumps & Turbines',
        'Navier-Stokes Equations',
      ],
    },
    {
      sem: 5,
      code: 'ME301',
      name: 'Heat and Mass Transfer',
      credits: 4,
      topics: [
        'Conduction (Fourier Law)',
        'Convection & Heat Exchangers',
        'Radiation (Planck/Stefan-Boltzmann)',
        'Fick’s Law of Diffusion',
      ],
    },
    {
      sem: 6,
      code: 'ME302',
      name: 'Theory of Machines',
      credits: 4,
      topics: [
        'Kinematic Chains & Inversions',
        'Gears & Gear Trains',
        'Flywheels & Governors',
        'Balancing of Rotating Masses',
      ],
    },
    {
      sem: 7,
      code: 'ME401',
      name: 'Manufacturing Technology & CAD/CAM',
      credits: 4,
      topics: [
        'Casting & Welding Processes',
        'CNC Machining',
        'G-Code & M-Code Programming',
        'Robotics in Manufacturing',
      ],
    },
    {
      sem: 8,
      code: 'ME402',
      name: 'Automobile Engineering & Power Plants',
      credits: 4,
      topics: [
        'Internal Combustion Engines',
        'Transmission & Braking Systems',
        'Electric & Hybrid Vehicles',
        'Renewable Energy Systems',
      ],
    },
  ],
};

export const runSeed = async () => {
  logger.info('[Seed] Connecting to MongoDB...');
  await connectDB();

  try {
    logger.info('[Seed] Clearing existing curriculum data...');
    await Subject.deleteMany({});
    await AcademicResource.deleteMany({});

    // 1. Seed Demo Users
    logger.info('[Seed] Seeding demo user accounts...');
    const hashedPass = await PasswordService.hash('Password123');

    const demoUsers = [
      {
        email: 'student@engineeros.dev',
        passwordHash: hashedPass,
        name: 'Alex Johnson',
        role: 'student',
        university: 'MIT',
        branch: 'Computer Science and Engineering',
        semester: 4,
        bio: '3rd year undergrad aiming for Google SDE and cracking GATE CS with top rank.',
        goals: ['Master Graph Algorithms & DP', 'Clear GATE CS 2026', 'Crack SDE-1 Internship'],
      },
      {
        email: 'senior@engineeros.dev',
        passwordHash: hashedPass,
        name: 'Sarah Chen',
        role: 'senior',
        isAlumni: true,
        university: 'MIT',
        branch: 'Computer Science and Engineering',
        semester: 8,
        profile: {
          currentCompany: 'Google (SDE-2)',
          graduationYear: 2024,
          githubHandle: 'sarahchen-dev',
        },
        bio: 'Alumni mentor. Happy to review resumes, discuss distributed systems, and share DSA prep roadmap.',
      },
      {
        email: 'admin@engineeros.dev',
        passwordHash: hashedPass,
        name: 'Dr. Arthur Pendelton',
        role: 'platformAdmin',
        university: 'MIT',
        branch: 'Computer Science and Engineering',
        semester: 8,
        bio: 'Faculty Coordinator & Platform Administrator.',
      },
    ];

    for (const u of demoUsers) {
      await User.findOneAndUpdate({ email: u.email }, { $set: u }, { upsert: true, new: true });
    }

    // 2. Seed Subjects for 2 Universities, 3 Branches, All 8 Semesters
    logger.info('[Seed] Seeding realistic subjects & syllabus topics...');
    let totalSubjectsCount = 0;
    let totalResourcesCount = 0;

    for (const university of UNIVERSITIES) {
      for (const branch of BRANCHES) {
        const templates = SUBJECT_TEMPLATES[branch] || [];

        for (const tpl of templates) {
          const topics = tpl.topics.map((t, idx) => ({
            topicId: `t_${tpl.code.toLowerCase()}_${idx + 1}`,
            title: t,
            description: `Core theoretical concepts and problem sets for ${t}.`,
            order: idx + 1,
            estimatedHours: 3,
          }));

          const subject = await Subject.create({
            code: `${university === 'IIT' ? 'CS-' : ''}${tpl.code}`,
            name: tpl.name,
            university,
            branch,
            semester: tpl.sem,
            credits: tpl.credits,
            description: `Official ${tpl.name} curriculum at ${university} for ${branch} (Semester ${tpl.sem}).`,
            syllabusOutline: `Unit I: Basics • Unit II: Advanced Structures • Unit III: Real-world Applications • Unit IV: Laboratory Practice.`,
            topics,
            isPublished: true,
          });

          totalSubjectsCount++;

          // Seed a few verified academic resources per subject
          await AcademicResource.create([
            {
              subjectId: subject._id,
              topicId: topics[0].topicId,
              title: `${tpl.name} — Lecture Notes & Formula Sheet`,
              type: 'notes',
              textContent: `Comprehensive lecture notes covering ${topics[0].title}. Key theorems, definitions, and proof sketches.`,
              author: 'Faculty Department',
              isPublished: true,
            },
            {
              subjectId: subject._id,
              topicId: topics[1]?.topicId || topics[0].topicId,
              title: `${tpl.code} Semester Examination Previous Year Questions (PYQ)`,
              type: 'pyq',
              year: 2024,
              textContent: `Past examination paper with complete step-by-step solutions and scoring marking scheme.`,
              author: 'Academic Council',
              isPublished: true,
            },
            {
              subjectId: subject._id,
              title: `${tpl.name} — Official Video Lecture Series & Laboratory Guide`,
              type: 'lecture',
              contentUrl: 'https://youtube.com/playlist?list=sample',
              textContent: 'Curated university lectures with timestamped topic breakdowns.',
              isPublished: true,
            },
          ]);

          totalResourcesCount += 3;
        }
      }
    }

    // 3. Initialize ProgressSummary for Demo Student
    const studentUser = await User.findOne({ email: 'student@engineeros.dev' });
    if (studentUser) {
      await ProgressSummary.findOneAndUpdate(
        { userId: studentUser._id },
        {
          $set: {
            academicsStats: {
              totalTopics: 28,
              completedTopics: 12,
              percentComplete: 43,
              subjectsInProgress: 4,
            },
            codingStats: {
              solvedCount: 16,
              easyCount: 10,
              mediumCount: 5,
              hardCount: 1,
              totalSubmissions: 24,
              acceptedSubmissions: 18,
              accuracyRate: 75,
              topicCoverage: ['Arrays', 'Strings', 'Binary Trees', 'Dynamic Programming'],
              streak: 4,
            },
            gateStats: {
              testsAttempted: 2,
              averageScore: 68,
              questionsAttempted: 130,
              accuracyRate: 72,
              weakTopics: [
                'Compiler Design: LALR Parsers',
                'Computer Networks: TCP Congestion Control',
              ],
            },
            assessmentStats: {
              totalAttempted: 1,
              averageScore: 85,
              upcomingScheduled: 1,
            },
            interviewStats: {
              sessionsCompleted: 1,
              averageReadinessScore: 78,
            },
            overallStreak: 4,
            lastActiveDate: new Date().toISOString().slice(0, 10),
            recentActivities: [
              {
                module: 'academics',
                action: 'TOPIC_COMPLETED',
                title: 'Completed: Dynamic Programming in Algorithms',
                occurredAt: new Date(Date.now() - 3600000),
              },
              {
                module: 'coding',
                action: 'PROBLEM_SOLVED',
                title: 'Accepted: Binary Tree Level Order Traversal',
                occurredAt: new Date(Date.now() - 7200000),
              },
            ],
          },
        },
        { upsert: true }
      );
    }

    // 4. Seed Coding Problems & Hidden Test Cases
    logger.info('[Seed] Seeding 26 DSA algorithm problems and test cases...');
    const problemsCount = await seedProblems();

    // 5. Seed GATE Mock Exams
    logger.info('[Seed] Seeding GATE mock tests...');
    const gateTestsCount = await seedGate();

    logger.info(
      {
        universities: UNIVERSITIES.length,
        branches: BRANCHES.length,
        subjectsSeeded: totalSubjectsCount,
        resourcesSeeded: totalResourcesCount,
        problemsSeeded: problemsCount,
        gateTestsSeeded: gateTestsCount,
      },
      '✅ Database seed completed successfully!'
    );
  } catch (error) {
    logger.error({ err: error }, '❌ Database seed failed');
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Execute if run directly from CLI
if (process.argv[1]?.endsWith('seed.js')) {
  runSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runSeed;
