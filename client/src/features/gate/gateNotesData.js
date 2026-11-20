export const GATE_NOTES = [
  {
    id: 'os',
    title: 'Operating Systems',
    code: 'CS-OS',
    icon: 'Cpu',
    description: 'Process scheduling, synchronization, deadlocks, paging, TLB hit ratios, and disk scheduling algorithms.',
    weightage: '8-10 Marks',
    topicsCount: 14,
    tags: ['Paging', 'Deadlock', 'Semaphores', 'Virtual Memory', 'Disk Scheduling'],
    sections: [
      {
        heading: 'Process & CPU Scheduling',
        content: `
- **Turnaround Time (TAT)**: $\\text{TAT} = \\text{Completion Time (CT)} - \\text{Arrival Time (AT)}$
- **Waiting Time (WT)**: $\\text{WT} = \\text{Turnaround Time (TAT)} - \\text{Burst Time (BT)}$
- **Response Time (RT)**: Time from process arrival to the first time CPU is allocated.
- **Preemptive vs Non-Preemptive**:
  - *SJF (Shortest Job First)* is optimal for minimizing average waiting time but causes starvation.
  - *SRTF (Shortest Remaining Time First)*: Preemptive version of SJF.
  - *Round Robin (RR)*: Dependent on Time Quantum ($q$). If $q \\to \\infty$, becomes FCFS; if $q \\to 0$, becomes Processor Sharing.
        `,
      },
      {
        heading: 'Process Synchronization & Deadlocks',
        content: `
- **Critical Section 3 Conditions**: Mutual Exclusion (mandatory), Progress (mandatory), Bounded Waiting (optional).
- **Semaphores**:
  - *Counting Semaphore*: Can take any integer value. $P(S)$ decrements $S$; if $S < 0$, process blocked. $V(S)$ increments $S$; if $S \\le 0$, wakes up one blocked process.
  - Initial value $S_0$. After $m$ wait operations and $n$ signal operations: $S_{\\text{final}} = S_0 - m + n$.
- **Deadlock 4 Coffman Conditions**: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.
- **Banker's Algorithm**:
  - $\\text{Need}[i][j] = \\text{Max}[i][j] - \\text{Allocation}[i][j]$
  - If $\\text{Need}_i \\le \\text{Available}$, allocate and simulate release: $\\text{Available} = \\text{Available} + \\text{Allocation}_i$.
        `,
      },
      {
        heading: 'Memory Management & Paging',
        content: `
- **Effective Access Time (EAT) with TLB**:
  $$\\text{EAT} = h \\times (t_{\\text{tlb}} + m) + (1 - h) \\times (t_{\\text{tlb}} + 2m)$$
  Where $h$ = TLB hit ratio, $t_{\\text{tlb}}$ = TLB search time, $m$ = Main memory access time.
  - *For 2-level paging*: $\\text{EAT} = h \\times (t_{\\text{tlb}} + m) + (1 - h) \\times (t_{\\text{tlb}} + 3m)$
- **Page Table Size Formula**:
  $$\\text{Page Table Size} = \\text{Number of Pages} \\times \\text{Page Table Entry (PTE) Size}$$
  $$\\text{Number of Pages} = \\frac{\\text{Logical Address Space}}{\\text{Page Size}}$$
- **Page Replacement**:
  - *FIFO*: Subject to **Belady's Anomaly** (increasing page frames increases page faults).
  - *LRU (Least Recently Used)*: Stack algorithm (no Belady's anomaly).
  - *Optimal Replacement*: Replaces page that will not be used for longest period (benchmark).
        `,
      },
      {
        heading: 'Disk Scheduling',
        content: `
- **SSTF (Shortest Seek Time First)**: Selects request closest to current head position (causes starvation).
- **SCAN (Elevator)**: Head moves in one direction servicing all requests until end, then reverses.
- **C-SCAN (Circular SCAN)**: Services in one direction only; returns to opposite end without servicing on return.
- **LOOK / C-LOOK**: Arm goes only as far as final request in each direction instead of cylinder boundary.
        `,
      },
    ],
    formulas: [
      { name: 'Turnaround Time', formula: 'TAT = CT - AT' },
      { name: 'Waiting Time', formula: 'WT = TAT - BT' },
      { name: 'EAT with TLB (1-Level)', formula: 'EAT = h*(t_tlb + m) + (1-h)*(t_tlb + 2m)' },
      { name: 'Bankers Need Matrix', formula: 'Need[i] = Max[i] - Allocation[i]' },
      { name: 'Semaphore Value', formula: 'S_final = S_init - Waits + Signals' },
    ],
  },
  {
    id: 'cn',
    title: 'Computer Networks',
    code: 'CS-CN',
    icon: 'Globe',
    description: 'OSI/TCP-IP models, Hamming distance, sliding window flow control, subnetting/CIDR, routing protocols, and TCP congestion control.',
    weightage: '8-10 Marks',
    topicsCount: 16,
    tags: ['Subnetting', 'Sliding Window', 'TCP Congestion', 'Routing', 'CIDR'],
    sections: [
      {
        heading: 'Physical & Data Link Layers',
        content: `
- **Delays**:
  - Transmission Delay: $T_t = \\frac{\\text{Packet Length } (L)}{\\text{Bandwidth } (B)}$
  - Propagation Delay: $T_p = \\frac{\\text{Distance } (d)}{\\text{Signal Speed } (v)}$
  - Round Trip Time: $\\text{RTT} = 2 \\times T_p$
  - Delay-Bandwidth Product: $\\text{BDP} = B \\times T_p$
- **Hamming Code**:
  - Distance $d \\ge 2e + 1$ to correct $e$ bit errors.
  - Distance $d \\ge e + 1$ to detect $e$ bit errors.
- **Sliding Window Protocols**:
  - Parameter $a = \\frac{T_p}{T_t}$
  - *Stop-and-Wait*: Efficiency $\\eta = \\frac{1}{1 + 2a}$. Throughput $= \\eta \\times B = \\frac{L}{T_t + 2T_p}$.
  - *Go-Back-N (GBN)*: Sender window size $N$, receiver window size $1$. Efficiency $\\eta = \\min\\left(1, \\frac{N}{1 + 2a}\\right)$. Minimum sequence numbers needed: $N + 1$.
  - *Selective Repeat (SR)*: Sender window $W_s = 2^{k-1}$, receiver window $W_r = 2^{k-1}$. Efficiency $\\eta = \\min\\left(1, \\frac{W_s}{1 + 2a}\\right)$. Minimum sequence numbers: $2 W_s$.
        `,
      },
      {
        heading: 'Network Layer & Subnetting',
        content: `
- **CIDR Subnetting (/n prefix)**:
  - Total IP addresses in subnet: $2^{32 - n}$
  - Number of usable host IP addresses: $2^{32 - n} - 2$ (excluding network ID and broadcast address).
  - First address = Network ID (all host bits 0).
  - Last address = Directed Broadcast Address (all host bits 1).
- **Routing Algorithms**:
  - *Dijkstra (Link State / OSPF)*: Finds shortest path tree; centralized state; $O((V+E)\\log V)$.
  - *Bellman-Ford (Distance Vector / RIP)*: Distributed; exchanges distance vectors with direct neighbors; subject to **Count-to-Infinity** problem. Split Horizon and Poison Reverse help mitigate.
        `,
      },
      {
        heading: 'Transport Layer & TCP Congestion Control',
        content: `
- **TCP Congestion Control Phases**:
  1. **Slow Start**: Congestion Window (cwnd) starts at $1 \\text{ MSS}$ and doubles every RTT (exponential growth: $1, 2, 4, 8, \\dots$) until threshold (ssthresh).
  2. **Congestion Avoidance**: Once $\\text{cwnd} \\ge \\text{ssthresh}$, cwnd increases by $+1 \\text{ MSS}$ per RTT (linear growth).
  3. **Packet Loss Event**:
     - *Time Out (Severe)*: $\\text{ssthresh} = \\max(2, \\lfloor \\text{cwnd} / 2 \\rfloor)$, $\\text{cwnd} = 1 \\text{ MSS}$. Enters Slow Start.
     - *3 Duplicate ACKs (Mild)*: Fast Recovery: $\\text{ssthresh} = \\max(2, \\lfloor \\text{cwnd} / 2 \\rfloor)$, $\\text{cwnd} = \\text{ssthresh} + 3$. Enters Congestion Avoidance.
        `,
      },
    ],
    formulas: [
      { name: 'Transmission Delay', formula: 'Tt = Length / Bandwidth' },
      { name: 'Propagation Delay', formula: 'Tp = Distance / Speed' },
      { name: 'Stop & Wait Efficiency', formula: 'Efficiency = 1 / (1 + 2*(Tp/Tt))' },
      { name: 'GBN Window Size Requirement', formula: 'Bits k >= ceil(log2(N + 1))' },
      { name: 'Usable Hosts in Subnet', formula: 'Hosts = 2^(32 - prefix) - 2' },
    ],
  },
  {
    id: 'dbms',
    title: 'Database Management Systems',
    code: 'CS-DB',
    icon: 'Database',
    description: 'Relational algebra, functional dependencies, 3NF/BCNF decomposition, conflict serializability, and B+ tree order calculations.',
    weightage: '7-9 Marks',
    topicsCount: 12,
    tags: ['Normalization', 'BCNF', 'Serializability', 'B+ Trees', 'Relational Algebra'],
    sections: [
      {
        heading: 'Relational Algebra & Tuple Calculus',
        content: `
- **Relational Operators**:
  - Selection ($\\sigma_C(R)$): Filters rows matching condition $C$.
  - Projection ($\\pi_{A_1, \\dots, A_k}(R)$): Projects specific columns and removes duplicate tuples.
  - Cross Product ($R \\times S$): Cartesian product of schemas.
  - Natural Join ($R \\bowtie S$): Equi-join on all shared common attributes, duplicate columns eliminated.
  - Division ($R \\div S$): Finds tuples in $R$ associated with all tuples in $S$ ("for all" queries).
        `,
      },
      {
        heading: 'Functional Dependencies & Normal Forms',
        content: `
- **Candidate Key**: Minimal superkey whose attribute closure $(X)^+ = \\text{all attributes in } R$.
- **Normal Forms**:
  - **1NF**: Atomic attributes only (no repeating groups/multivalued attributes).
  - **2NF**: In 1NF and no non-prime attribute is partially dependent on any candidate key.
  - **3NF**: In 2NF and for every functional dependency $X \\to Y$:
    - Either $X$ is a superkey, OR $Y$ is a prime attribute.
  - **BCNF (Boyce-Codd)**: In 3NF and for every non-trivial $X \\to Y$, $X$ must strictly be a superkey.
- **Decomposition Properties**:
  - *Lossless Join*: $R_1 \\cap R_2 \\to R_1$ OR $R_1 \\cap R_2 \\to R_2$ (Common attributes must be superkey of at least one relation).
  - *Dependency Preserving*: $(F_1 \\cup F_2)^+ = F^+$. 3NF always guarantees both lossless and dependency preserving; BCNF may lose dependencies.
        `,
      },
      {
        heading: 'Transactions & Concurrency Control',
        content: `
- **ACID**: Atomicity (All or None), Consistency, Isolation, Durability.
- **Conflict Serializability**:
  - Two operations conflict if they belong to different transactions, access the same data item, and at least one is a Write.
  - Construct Precedence Graph: Directed edge $T_i \\to T_j$ if $T_i$ precedes $T_j$ on a conflicting operation.
  - **Schedule is Conflict Serializable iff Precedence Graph has NO cycles**.
- **Two-Phase Locking (2PL)**:
  - Basic 2PL guarantees Conflict Serializability, but can have deadlocks and cascading rollbacks.
  - Strict 2PL: All Exclusive locks held until commit/abort (prevents cascading aborts).
  - Rigorous 2PL: All Shared & Exclusive locks held until commit/abort (guarantees strict serializability).
        `,
      },
      {
        heading: 'B+ Tree Order & Fanout',
        content: `
- **Internal Node of Order $p$**:
  - Contains at most $p$ block pointers and $p - 1$ key values.
  - Order formula: $p \\times P_{\\text{block}} + (p - 1) \\times K \\le B$ (Where $B$ is block size).
- **Leaf Node of Order $p_{\\text{leaf}}$**:
  - Order formula: $p_{\\text{leaf}} \\times (K + P_{\\text{record}}) + P_{\\text{block}} \\le B$
- **Capacity**:
  - Minimum keys in non-root internal node: $\\lceil p/2 \\rceil - 1$.
  - Minimum keys in leaf node: $\\lceil p_{\\text{leaf}}/2 \\rceil$.
        `,
      },
    ],
    formulas: [
      { name: 'Internal B+ Tree Order', formula: 'p*P_block + (p-1)*K <= BlockSize' },
      { name: 'Leaf B+ Tree Order', formula: 'p*(K + P_record) + P_block <= BlockSize' },
      { name: 'Lossless Join Condition', formula: '(R1 ∩ R2) -> R1 OR (R1 ∩ R2) -> R2' },
      { name: 'Min Keys in Internal Node', formula: 'ceil(p/2) - 1' },
    ],
  },
  {
    id: 'dsa',
    title: 'Data Structures & Algorithms',
    code: 'CS-DSA',
    icon: 'Binary',
    description: 'Master theorem, asymptotic notation, AVL rotations, graph traversals, greedy algorithms, and dynamic programming.',
    weightage: '12-15 Marks',
    topicsCount: 18,
    tags: ['Master Theorem', 'AVL Trees', 'Dijkstra', 'DP', 'Heaps'],
    sections: [
      {
        heading: 'Asymptotic Analysis & Master Theorem',
        content: `
- **Standard Recurrence**: $T(n) = a T(n/b) + \\Theta(n^k \\log^p n)$ where $a \\ge 1, b > 1, k \\ge 0$:
  - **Case 1**: If $\\log_b a > k \\implies T(n) = \\Theta(n^{\\log_b a})$
  - **Case 2**: If $\\log_b a = k$:
    - If $p > -1 \\implies T(n) = \\Theta(n^k \\log^{p+1} n)$
    - If $p = -1 \\implies T(n) = \\Theta(n^k \\log \\log n)$
    - If $p < -1 \\implies T(n) = \\Theta(n^k)$
  - **Case 3**: If $\\log_b a < k$:
    - If $p \\ge 0 \\implies T(n) = \\Theta(n^k \\log^p n)$
        `,
      },
      {
        heading: 'Trees & Heaps',
        content: `
- **Binary Trees**:
  - Maximum nodes in binary tree of height $h$: $2^{h+1} - 1$.
  - Minimum height of binary tree with $n$ nodes: $\\lceil \\log_2(n+1) \\rceil - 1$.
  - In any non-empty binary tree: Number of leaf nodes $n_0 = n_2 + 1$ (where $n_2$ is nodes with degree 2).
- **AVL Trees**:
  - Balance Factor: $\\text{BF} = \\text{Height}(\\text{left}) - \\text{Height}(\\text{right}) \\in \\{-1, 0, 1\\}$.
  - Minimum nodes in AVL tree of height $h$: $N(h) = N(h-1) + N(h-2) + 1$, where $N(0) = 1, N(1) = 2$.
- **Heaps**:
  - Array representation of 0-indexed heap: Parent at $\\lfloor(i-1)/2\\rfloor$, Left child at $2i + 1$, Right child at $2i + 2$.
  - Build-heap time complexity: $O(n)$ using bottom-up heapify.
        `,
      },
      {
        heading: 'Graph Algorithms & Dynamic Programming',
        content: `
- **Shortest Paths**:
  - *BFS*: Unweighted graphs, $O(V + E)$.
  - *Dijkstra*: Non-negative weights, $O((V + E) \\log V)$ using Fibonacci/Min Heap.
  - *Bellman-Ford*: Negative weights tolerated, detects negative weight cycles, $O(V \\cdot E)$.
  - *Floyd-Warshall*: All-pairs shortest path, $O(V^3)$.
- **Minimum Spanning Trees**:
  - *Kruskal*: Edge-centric with Union-Find (Disjoint Set), $O(E \\log E) = O(E \\log V)$.
  - *Prim*: Vertex-centric with priority queue, $O(E + V \\log V)$.
- **Dynamic Programming Common Runtimes**:
  - 0/1 Knapsack: $O(n W)$ pseudo-polynomial.
  - Longest Common Subsequence (LCS): $O(n \\cdot m)$.
  - Matrix Chain Multiplication: $O(n^3)$.
        `,
      },
    ],
    formulas: [
      { name: 'Master Theorem Case 1', formula: 'If log_b(a) > k => Theta(n^log_b(a))' },
      { name: 'Master Theorem Case 2', formula: 'If log_b(a) == k => Theta(n^k * log^(p+1)(n))' },
      { name: 'Binary Tree Leaves Relation', formula: 'Leaf nodes n0 = n2 + 1' },
      { name: 'Min AVL Nodes at Height h', formula: 'N(h) = N(h-1) + N(h-2) + 1' },
    ],
  },
  {
    id: 'toc',
    title: 'Theory of Computation',
    code: 'CS-TOC',
    icon: 'Layers',
    description: 'Chomsky hierarchy, DFA/NFA equivalence, pumping lemma, closure properties, decidability, and Turing machines.',
    weightage: '7-9 Marks',
    topicsCount: 11,
    tags: ['Chomsky Hierarchy', 'DFA Minimization', 'CFLs', 'Turing Machines', 'Decidability'],
    sections: [
      {
        heading: 'Chomsky Hierarchy & Languages',
        content: `
- **Chomsky Hierarchy**:
  - **Type 3 (Regular)**: Recognized by Finite Automata (DFA, NFA). Grammars $A \\to aB \\mid a$.
  - **Type 2 (Context-Free)**: Recognized by Pushdown Automata (PDA). Grammars $A \\to \\alpha$.
  - **Type 1 (Context-Sensitive)**: Recognized by Linear Bounded Automata (LBA). $\\alpha A \\beta \\to \\alpha \\gamma \\beta$.
  - **Type 0 (Recursively Enumerable)**: Recognized by Turing Machines. Unrestricted.
- **Power Equivalence**:
  - $\\text{DFA} \\equiv \\text{NFA} \\equiv \\epsilon\\text{-NFA}$ (Equal expressive power).
  - $\\text{DPDA} \\subsetneq \\text{NPDA}$ (Deterministic PDA is strictly weaker than Non-deterministic PDA).
  - $\\text{DTM} \\equiv \\text{NTM}$ (Deterministic TM equals Non-deterministic TM in power).
        `,
      },
      {
        heading: 'Closure Properties Cheat Sheet',
        content: `
| Operation | Regular | CFL | DCFL | CSL | Recursive | RE |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Union | YES | YES | NO | YES | YES | YES |
| Intersection | YES | NO | NO | YES | YES | YES |
| Complement | YES | NO | YES | YES | YES | NO |
| Concatenation | YES | YES | NO | YES | YES | YES |
| Kleene Star | YES | YES | NO | YES | YES | YES |
| Reversal | YES | YES | NO | YES | YES | YES |
| Intersection with Regular | YES | YES | YES | YES | YES | YES |
        `,
      },
      {
        heading: 'Decidability & Halting Problem',
        content: `
- **Decidable Problems for Regular Languages**:
  - Emptiness ($L = \\emptyset$): Decidable.
  - Finiteness: Decidable.
  - Membership ($w \\in L$): Decidable.
  - Equivalence ($L_1 = L_2$): Decidable.
- **Context-Free Languages**:
  - Membership ($w \\in L$): Decidable (via CYK algorithm).
  - Emptiness ($L = \\emptyset$): Decidable.
  - Equivalence ($L_1 = L_2$): **Undecidable**.
  - Ambiguity of Grammar: **Undecidable**.
  - $L = \\Sigma^*$: **Undecidable**.
- **Rice's Theorem**:
  - Any non-trivial semantic property of a Turing Machine language is **Undecidable**.
        `,
      },
    ],
    formulas: [
      { name: 'Pumping Lemma (Regular)', formula: 'w = xyz, |xy| <= p, |y| >= 1, xy^i z in L' },
      { name: 'DFA vs NFA States', formula: 'Max DFA states for n-state NFA = 2^n' },
      { name: 'Chomsky Subset Chain', formula: 'Regular ⊂ DCFL ⊂ CFL ⊂ CSL ⊂ Recursive ⊂ RE' },
    ],
  },
  {
    id: 'coa',
    title: 'Computer Organization & Architecture',
    code: 'CS-COA',
    icon: 'HardDrive',
    description: 'Pipelining hazards, cache memory address translation, IEEE 754 floating point format, and memory interleaving.',
    weightage: '8-10 Marks',
    topicsCount: 13,
    tags: ['Pipelining', 'Cache Mapping', 'IEEE 754', 'Hazards', 'Addressing Modes'],
    sections: [
      {
        heading: 'Instruction Pipelining & Speedup',
        content: `
- **Speedup Ratio**:
  $$S = \\frac{T_{\\text{non-pipeline}}}{T_{\\text{pipeline}}} = \\frac{n \\cdot k \\cdot \\tau}{(k + n - 1) \\cdot \\tau} \\xrightarrow{n \\to \\infty} k$$
  Where $k$ = number of stages, $n$ = number of instructions, $\\tau$ = clock cycle time.
- **Clock Cycle Time**:
  $$\\tau = \\max(\\text{stage delays}) + \\text{latch delay}$$
- **Speedup with Stalls**:
  $$S = \\frac{k}{1 + \\text{Stall cycles per instruction}}$$
- **Pipeline Hazards**:
  - *Structural*: Resource conflict (e.g., single memory port for Instruction and Data).
  - *Data*: Dependency between instructions (RAW True dependency, WAR Anti-dependency, WAW Output dependency). Solved via Operand Forwarding or NOP bubbles.
  - *Control*: Branch instructions. Resolved via Branch Prediction or Delayed Branch.
        `,
      },
      {
        heading: 'Cache Memory & Effective Access Time',
        content: `
- **Cache Mapping Schemes**:
  1. **Direct Mapped**: Each block maps to exactly one line: $\\text{Line} = \\text{Block} \\bmod \\text{Total Lines}$.
     - Address: $\\text{Tag} \\mid \\text{Line Number} \\mid \\text{Word Offset}$.
  2. **Set Associative**: $k$-way set associative has sets of $k$ lines each: $\\text{Set} = \\text{Block} \\bmod \\text{Total Sets}$.
     - Address: $\\text{Tag} \\mid \\text{Set Index} \\mid \\text{Word Offset}$.
  3. **Fully Associative**: Block can go to any cache slot.
     - Address: $\\text{Tag} \\mid \\text{Word Offset}$.
- **Effective Access Time (EAT)**:
  $$\\text{EAT} = H \\times t_c + (1 - H) \\times (t_c + t_m)$$
  Where $H$ = cache hit ratio, $t_c$ = cache access time, $t_m$ = memory miss penalty.
        `,
      },
      {
        heading: 'IEEE 754 Floating Point Standard',
        content: `
- **Single Precision (32 bits)**:
  - Sign bit: 1 bit ($0 = +, 1 = -$).
  - Exponent: 8 bits with Bias = 127.
  - Mantissa: 23 bits (normalized with implicit leading 1).
  - Value: $(-1)^S \\times 1.M \\times 2^{E - 127}$
- **Double Precision (64 bits)**:
  - Sign: 1 bit, Exponent: 11 bits (Bias = 1023), Mantissa: 52 bits.
        `,
      },
    ],
    formulas: [
      { name: 'Pipeline Speedup', formula: 'S = (n * k) / (k + n - 1)' },
      { name: 'Set Associative Number of Sets', formula: 'Sets = Total Cache Lines / k' },
      { name: 'Cache Hit Effective Access', formula: 'EAT = H*tc + (1-H)*(tc + tm)' },
      { name: 'IEEE 754 Single Precision', formula: '(-1)^s * (1.M) * 2^(E - 127)' },
    ],
  },
  {
    id: 'digital',
    title: 'Digital Logic',
    code: 'CS-DL',
    icon: 'Radio',
    description: 'Boolean algebra minimization, K-Maps, multiplexers, decoders, flip-flops, and counters.',
    weightage: '5-7 Marks',
    topicsCount: 9,
    tags: ['K-Maps', 'Multiplexers', 'Flip Flops', 'Counters', 'Boolean Algebra'],
    sections: [
      {
        heading: 'Boolean Algebra & K-Maps',
        content: `
- **Consensus Theorem**: $AB + A'C + BC = AB + A'C$ (Dual: $(A+B)(A'+C)(B+C) = (A+B)(A'+C)$).
- **Karnaugh Maps**:
  - Implicant: Any product term where function is 1.
  - Prime Implicant (PI): Maximal group of adjacent 1s that cannot be combined with another group.
  - Essential Prime Implicant (EPI): A PI that covers at least one '1' not covered by any other PI.
        `,
      },
      {
        heading: 'Combinational & Sequential Circuits',
        content: `
- **Multiplexer (MUX)**:
  - $2^n \\to 1$ MUX has $n$ select lines.
  - Can implement any Boolean function of $n+1$ variables using $2^n \\to 1$ MUX.
- **Flip-Flops Characteristic Equations**:
  - **SR Flip-Flop**: $Q_{next} = S + R' Q$ (Invalid when $S = R = 1$).
  - **JK Flip-Flop**: $Q_{next} = J Q' + K' Q$ (Toggles when $J = K = 1$).
  - **D Flip-Flop**: $Q_{next} = D$.
  - **T Flip-Flop**: $Q_{next} = T \\oplus Q$.
- **Counters**:
  - Mod-$N$ counter requires $n = \\lceil \\log_2 N \\rceil$ flip-flops.
  - Johnson Counter with $n$ flip-flops has $2n$ states.
  - Ring Counter with $n$ flip-flops has $n$ states.
        `,
      },
    ],
    formulas: [
      { name: 'JK Flip Flop Next State', formula: 'Q(t+1) = J*Q_bar + K_bar*Q' },
      { name: 'T Flip Flop Next State', formula: 'Q(t+1) = T XOR Q' },
      { name: 'Mod-N Flip Flops Required', formula: 'n = ceil(log2(N))' },
      { name: 'Consensus Theorem', formula: 'AB + A_bar*C + BC = AB + A_bar*C' },
    ],
  },
  {
    id: 'math',
    title: 'Engineering Mathematics & Discrete Math',
    code: 'CS-MATH',
    icon: 'Sigma',
    description: 'Linear algebra, Bayes theorem, eigenvalues, graph theory planar formulas, combinatorics, and logic.',
    weightage: '13-15 Marks',
    topicsCount: 15,
    tags: ['Eigenvalues', 'Bayes Theorem', 'Planar Graphs', 'Combinatorics', 'Logic'],
    sections: [
      {
        heading: 'Linear Algebra',
        content: `
- **Determinant & Rank**:
  - A square matrix $A$ is invertible iff $\\det(A) \\ne 0$.
  - Rank $\\rho(A) = \\text{Number of linearly independent rows or columns}$.
- **Eigenvalues & Eigenvectors**:
  - Characteristic equation: $\\det(A - \\lambda I) = 0$.
  - **Sum of eigenvalues**: $\\sum \\lambda_i = \\text{Trace}(A) = \\sum a_{ii}$.
  - **Product of eigenvalues**: $\\prod \\lambda_i = \\det(A)$.
  - **Cayley-Hamilton Theorem**: Every square matrix satisfies its own characteristic equation: $p(A) = 0$.
        `,
      },
      {
        heading: 'Graph Theory & Combinatorics',
        content: `
- **Handshaking Lemma**:
  $$\\sum_{v \\in V} \\deg(v) = 2 |E|$$
  Sum of degrees of all vertices is even; number of vertices with odd degree is always even.
- **Euler's Formula for Connected Planar Graphs**:
  $$V - E + F = 2$$
  - For simple planar graph with $V \\ge 3$: $E \\le 3V - 6$.
  - For triangle-free planar graph: $E \\le 2V - 4$.
- **Combinatorics**:
  - Number of subsets of size $r$: $\\binom{n}{r} = \\frac{n!}{r!(n-r)!}$.
  - Derangements (no element in original place): $D_n = n! \\sum_{k=0}^n \\frac{(-1)^k}{k!} \\approx \\lfloor \\frac{n!}{e} + 0.5 \\rfloor$.
        `,
      },
      {
        heading: 'Probability & Calculus',
        content: `
- **Bayes Theorem**:
  $$P(A_i \\mid B) = \\frac{P(B \\mid A_i) P(A_i)}{\\sum_{j} P(B \\mid A_j) P(A_j)}$$
- **Distributions**:
  - *Binomial*: $P(X = k) = \\binom{n}{k} p^k (1-p)^{n-k}$, Mean $= np$, Variance $= np(1-p)$.
  - *Poisson*: $P(X = k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}$, Mean = Variance $= \\lambda$.
        `,
      },
    ],
    formulas: [
      { name: 'Euler Planar Graph Formula', formula: 'V - E + F = 2' },
      { name: 'Eigenvalues Sum Property', formula: 'Sum(lambda_i) = Trace(A)' },
      { name: 'Eigenvalues Product Property', formula: 'Prod(lambda_i) = Det(A)' },
      { name: 'Bayes Theorem', formula: 'P(A|B) = [P(B|A)*P(A)] / P(B)' },
      { name: 'Handshaking Lemma', formula: 'Sum(deg(v)) = 2*E' },
    ],
  },
];
