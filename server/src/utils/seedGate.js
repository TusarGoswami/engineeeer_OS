import { GateTest } from '../modules/gate/gateTest.model.js';

export const GATE_TESTS = [
  {
    title: 'GATE CS 2026 — All India National Mock 1',
    description:
      'Full-length comprehensive GATE Computer Science & Information Technology mock test matching official IIT pattern.',
    subject: 'Computer Science and Information Technology',
    durationMinutes: 180,
    totalMarks: 20,
    totalQuestions: 10,
    questions: [
      {
        questionId: 'q1',
        questionText:
          'What is the tightest worst-case asymptotic time complexity of building a Binary Heap of n elements from an unordered array?',
        type: 'mcq',
        marks: 1,
        negativeMarks: 0.33,
        options: [
          { id: 'A', text: 'O(n log n)' },
          { id: 'B', text: 'O(n)' },
          { id: 'C', text: 'O(n^2)' },
          { id: 'D', text: 'O(log n)' },
        ],
        correctOptions: ['B'],
        topic: 'Algorithms',
        explanation:
          'Bottom-up heapify takes O(n) sum of heights series sum from h=0 to log n of n/2^{h+1} * h = O(n).',
      },
      {
        questionId: 'q2',
        questionText:
          'Which of the following problems are known to be undecidable for Turing Machines? (Select all that apply)',
        type: 'msq',
        marks: 2,
        negativeMarks: 0,
        options: [
          { id: 'A', text: 'Halting Problem on empty tape' },
          { id: 'B', text: 'State Entry Problem' },
          { id: 'C', text: 'Emptiness problem for DFA' },
          { id: 'D', text: 'Equivalence problem for two Turing machines' },
        ],
        correctOptions: ['A', 'B', 'D'],
        topic: 'Theory of Computation',
        explanation:
          'Halting problem, state entry, and TM equivalence are undecidable (Rice Theorem). Emptiness of DFA is decidable via graph reachability.',
      },
      {
        questionId: 'q3',
        questionText:
          'Consider a 5-stage instruction pipeline with stages Fetch (IF), Decode (ID), Execute (EX), Memory (MEM), and WriteBack (WB) with delays 5ns, 7ns, 10ns, 8ns, and 6ns respectively. What is the clock cycle time of this pipeline in nanoseconds?',
        type: 'nat',
        marks: 1,
        negativeMarks: 0,
        natRange: { min: 10, max: 10 },
        topic: 'Computer Organization & Architecture',
        explanation:
          'The clock cycle of a synchronous pipeline is governed by the slowest stage delay, which is EX = 10ns.',
      },
      {
        questionId: 'q4',
        questionText:
          'In a paging system, the page size is 4 KB and page table entry size is 4 bytes. If the system uses a two-level page table where each level page table fits exactly into one page frame, what is the maximum virtual address space in Gigabytes?',
        type: 'nat',
        marks: 2,
        negativeMarks: 0,
        natRange: { min: 4, max: 4 },
        topic: 'Operating Systems',
        explanation:
          'Page frame = 4KB. Entries per page table = 4096 / 4 = 1024 = 2^10 entries. Two levels => 2^10 * 2^10 * 4KB = 2^20 * 2^12 = 2^32 bytes = 4 GB.',
      },
      {
        questionId: 'q5',
        questionText:
          'Which of the following statements about relational databases and normalization is/are TRUE?',
        type: 'msq',
        marks: 2,
        negativeMarks: 0,
        options: [
          { id: 'A', text: 'Every relation in BCNF is also in 3NF' },
          { id: 'B', text: 'Dependency preservation is always guaranteed in 3NF decomposition' },
          { id: 'C', text: 'Dependency preservation is always guaranteed in BCNF decomposition' },
          { id: 'D', text: 'Lossless join decomposition is always possible in BCNF' },
        ],
        correctOptions: ['A', 'B', 'D'],
        topic: 'Databases',
        explanation:
          'BCNF is strictly stronger than 3NF. 3NF always guarantees dependency preservation, whereas BCNF may not preserve all functional dependencies.',
      },
      {
        questionId: 'q6',
        questionText:
          'What is the maximum number of edges in an undirected bipartite graph having 16 vertices?',
        type: 'nat',
        marks: 2,
        negativeMarks: 0,
        natRange: { min: 64, max: 64 },
        topic: 'Discrete Mathematics',
        explanation:
          'For a bipartite graph with n vertices, maximum edges occur when partition sizes are equal: (n/2) * (n/2) = 8 * 8 = 64.',
      },
      {
        questionId: 'q7',
        questionText:
          'In TCP congestion control, what happens immediately when a triple duplicate ACK is received by the sender?',
        type: 'mcq',
        marks: 1,
        negativeMarks: 0.33,
        options: [
          { id: 'A', text: 'Congestion window is reset to 1 MSS and slow start begins' },
          {
            id: 'B',
            text: 'Fast Retransmit & Fast Recovery are triggered, setting ssthresh to half of cwnd',
          },
          { id: 'C', text: 'Connection is closed immediately' },
          { id: 'D', text: 'Timeout counter is doubled' },
        ],
        correctOptions: ['B'],
        topic: 'Computer Networks',
        explanation:
          'Triple duplicate ACK indicates packet loss with network still delivering subsequent packets, so Fast Retransmit and Fast Recovery engage without dropping to 1 MSS.',
      },
      {
        questionId: 'q8',
        questionText:
          'Which of the following grammar classes are unambiguous? (Select all that apply)',
        type: 'msq',
        marks: 2,
        negativeMarks: 0,
        options: [
          { id: 'A', text: 'LL(1) grammars' },
          { id: 'B', text: 'LR(1) grammars' },
          { id: 'C', text: 'Operator grammars' },
          { id: 'D', text: 'LALR(1) grammars' },
        ],
        correctOptions: ['A', 'B', 'D'],
        topic: 'Compiler Design',
        explanation:
          'LL(1), LR(1), and LALR(1) parsers require deterministic unambiguous parse tables. Operator precedence grammars can be ambiguous.',
      },
      {
        questionId: 'q9',
        questionText:
          'A Boolean function f(A, B, C) = Σ m(0, 1, 4, 5, 6). What is the minimal number of prime implicants in the minimized SOP form?',
        type: 'nat',
        marks: 2,
        negativeMarks: 0,
        natRange: { min: 2, max: 2 },
        topic: 'Digital Logic',
        explanation:
          "K-map grouping: m(0,1,4,5) gives B', and m(4,6) gives AB'. Minimal SOP = B' + AC', which consists of 2 prime implicants.",
      },
      {
        questionId: 'q10',
        questionText:
          'In Dijkstra shortest path algorithm for a graph G = (V, E) with non-negative edge weights using a Fibonacci Heap, what is the running time complexity?',
        type: 'mcq',
        marks: 2,
        negativeMarks: 0.66,
        options: [
          { id: 'A', text: 'O(|V| log |V| + |E|)' },
          { id: 'B', text: 'O(|E| log |V|)' },
          { id: 'C', text: 'O(|V|^2)' },
          { id: 'D', text: 'O(|V| + |E|)' },
        ],
        correctOptions: ['A'],
        topic: 'Algorithms',
        explanation:
          'With Fibonacci Heaps, Extract-Min is O(log V) done |V| times and Decrease-Key is O(1) amortized done |E| times => O(|V| log |V| + |E|).',
      },
    ],
    isPublished: true,
  },
];

export async function seedGate() {
  await GateTest.deleteMany({});
  for (const t of GATE_TESTS) {
    await GateTest.create(t);
  }
  return GATE_TESTS.length;
}
