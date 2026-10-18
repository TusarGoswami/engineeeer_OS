import { CodingProblem } from '../modules/coding/codingProblem.model.js';
import { CodingTestCase } from '../modules/coding/codingTestCase.model.js';

export const DSA_PROBLEMS = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    statementMarkdown:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    difficulty: 'easy',
    tags: ['Array', 'Hash Table'],
    sampleTestCases: [
      {
        input: '4\n2 7 11 15\n9',
        output: '0 1',
        explanation: 'nums[0] + nums[1] == 9, return [0, 1]',
      },
      { input: '3\n3 2 4\n6', output: '1 2', explanation: 'nums[1] + nums[2] == 6, return [1, 2]' },
    ],
    hiddenTestCases: [
      { input: '2\n3 3\n6', output: '0 1' },
      { input: '5\n1 5 3 7 9\n12', output: '1 3' },
    ],
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    statementMarkdown:
      'You are given an array `prices` where `prices[i]` is the price of a given stock on the `i-th` day.\n\nFind the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.',
    difficulty: 'easy',
    tags: ['Array', 'Dynamic Programming'],
    sampleTestCases: [
      {
        input: '6\n7 1 5 3 6 4',
        output: '5',
        explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.',
      },
      {
        input: '5\n7 6 4 3 1',
        output: '0',
        explanation: 'In this case, no transactions are done and max profit = 0.',
      },
    ],
    hiddenTestCases: [
      { input: '4\n2 4 1 7', output: '6' },
      { input: '3\n1 2 4', output: '3' },
    ],
  },
  {
    title: 'Contains Duplicate',
    slug: 'contains-duplicate',
    statementMarkdown:
      'Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.',
    difficulty: 'easy',
    tags: ['Array', 'Hash Table', 'Sorting'],
    sampleTestCases: [
      { input: '4\n1 2 3 1', output: 'true', explanation: '1 appears twice.' },
      { input: '4\n1 2 3 4', output: 'false', explanation: 'All elements distinct.' },
    ],
    hiddenTestCases: [
      { input: '5\n1 1 1 3 3', output: 'true' },
      { input: '1\n99', output: 'false' },
    ],
  },
  {
    title: 'Product of Array Except Self',
    slug: 'product-of-array-except-self',
    statementMarkdown:
      'Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\n\nThe algorithm must run in O(n) time and without using the division operation.',
    difficulty: 'medium',
    tags: ['Array', 'Prefix Sum'],
    sampleTestCases: [
      {
        input: '4\n1 2 3 4',
        output: '24 12 8 6',
        explanation: 'Prefix and postfix multiplication without division.',
      },
    ],
    hiddenTestCases: [{ input: '5\n-1 1 0 -3 3', output: '0 0 9 0 0' }],
  },
  {
    title: 'Maximum Subarray (Kadane)',
    slug: 'maximum-subarray',
    statementMarkdown:
      'Given an integer array `nums`, find the subarray with the largest sum, and return its sum.',
    difficulty: 'medium',
    tags: ['Array', 'Divide and Conquer', 'Dynamic Programming'],
    sampleTestCases: [
      {
        input: '9\n-2 1 -3 4 -1 2 1 -5 4',
        output: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum 6.',
      },
      { input: '1\n1', output: '1', explanation: 'Single element.' },
    ],
    hiddenTestCases: [{ input: '5\n5 4 -1 7 8', output: '23' }],
  },
  {
    title: 'Valid Anagram',
    slug: 'valid-anagram',
    statementMarkdown:
      'Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.',
    difficulty: 'easy',
    tags: ['Hash Table', 'String', 'Sorting'],
    sampleTestCases: [
      {
        input: 'anagram nagaram',
        output: 'true',
        explanation: 'Both contain same frequency of characters.',
      },
      { input: 'rat car', output: 'false', explanation: 'Characters differ.' },
    ],
    hiddenTestCases: [{ input: 'listen silent', output: 'true' }],
  },
  {
    title: 'Group Anagrams',
    slug: 'group-anagrams',
    statementMarkdown:
      'Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.',
    difficulty: 'medium',
    tags: ['Array', 'Hash Table', 'String'],
    sampleTestCases: [
      {
        input: '6\neat tea tan ate nat bat',
        output: '3 groups',
        explanation: '["bat"], ["nat","tan"], ["ate","eat","tea"]',
      },
    ],
    hiddenTestCases: [{ input: '1\na', output: '1 groups' }],
  },
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    statementMarkdown:
      'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nOpen brackets must be closed by the same type of brackets in the correct order.',
    difficulty: 'easy',
    tags: ['String', 'Stack'],
    sampleTestCases: [
      { input: '()', output: 'true', explanation: 'Valid pairing.' },
      { input: '()[]{}', output: 'true', explanation: 'All paired correctly.' },
      { input: '(]', output: 'false', explanation: 'Mismatched closing bracket.' },
    ],
    hiddenTestCases: [
      { input: '([)]', output: 'false' },
      { input: '{[]}', output: 'true' },
    ],
  },
  {
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list',
    statementMarkdown:
      'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    difficulty: 'easy',
    tags: ['Linked List', 'Recursion'],
    sampleTestCases: [
      { input: '5\n1 2 3 4 5', output: '5 4 3 2 1', explanation: 'List reversed.' },
      { input: '2\n1 2', output: '2 1', explanation: 'Two nodes reversed.' },
    ],
    hiddenTestCases: [{ input: '1\n1', output: '1' }],
  },
  {
    title: 'Merge Two Sorted Lists',
    slug: 'merge-two-sorted-lists',
    statementMarkdown:
      'You are given the heads of two sorted linked lists `list1` and `list2`. Merge the two lists into one sorted list.',
    difficulty: 'easy',
    tags: ['Linked List', 'Recursion'],
    sampleTestCases: [
      { input: '3\n1 2 4\n3\n1 3 4', output: '1 1 2 3 4 4', explanation: 'Merged sorted list.' },
    ],
    hiddenTestCases: [{ input: '0\n\n1\n0', output: '0' }],
  },
  {
    title: 'Linked List Cycle',
    slug: 'linked-list-cycle',
    statementMarkdown:
      'Given `head`, the head of a linked list, determine if the linked list has a cycle in it using Floyd Cycle-Finding Algorithm (Tortoise and Hare).',
    difficulty: 'easy',
    tags: ['Hash Table', 'Linked List', 'Two Pointers'],
    sampleTestCases: [
      { input: '4\n3 2 0 -4\n1', output: 'true', explanation: 'Tail connects to node index 1.' },
      { input: '1\n1\n-1', output: 'false', explanation: 'No cycle.' },
    ],
    hiddenTestCases: [{ input: '2\n1 2\n0', output: 'true' }],
  },
  {
    title: 'Invert Binary Tree',
    slug: 'invert-binary-tree',
    statementMarkdown:
      'Given the root of a binary tree, invert the tree (swap left and right child nodes recursively), and return its root.',
    difficulty: 'easy',
    tags: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'],
    sampleTestCases: [
      { input: '7\n4 2 7 1 3 6 9', output: '4 7 2 9 6 3 1', explanation: 'Mirrored binary tree.' },
    ],
    hiddenTestCases: [{ input: '3\n2 1 3', output: '2 3 1' }],
  },
  {
    title: 'Maximum Depth of Binary Tree',
    slug: 'maximum-depth-of-binary-tree',
    statementMarkdown:
      'Given the root of a binary tree, return its maximum depth.\n\nA binary tree maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.',
    difficulty: 'easy',
    tags: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'],
    sampleTestCases: [
      { input: '5\n3 9 20 null null 15 7', output: '3', explanation: 'Maximum path has 3 nodes.' },
    ],
    hiddenTestCases: [{ input: '2\n1 null 2', output: '2' }],
  },
  {
    title: 'Binary Tree Level Order Traversal',
    slug: 'binary-tree-level-order-traversal',
    statementMarkdown:
      'Given the root of a binary tree, return the level order traversal of its nodes values (i.e., from left to right, level by level).',
    difficulty: 'medium',
    tags: ['Tree', 'Breadth-First Search', 'Binary Tree'],
    sampleTestCases: [
      {
        input: '5\n3 9 20 15 7',
        output: '[[3],[9,20],[15,7]]',
        explanation: 'Level-by-level BFS traversal.',
      },
    ],
    hiddenTestCases: [{ input: '1\n1', output: '[[1]]' }],
  },
  {
    title: 'Validate Binary Search Tree',
    slug: 'validate-binary-search-tree',
    statementMarkdown:
      'Given the root of a binary tree, determine if it is a valid binary search tree (BST).\n\nA valid BST has left subtree keys strictly less than node key and right subtree keys strictly greater.',
    difficulty: 'medium',
    tags: ['Tree', 'Depth-First Search', 'Binary Search Tree', 'Binary Tree'],
    sampleTestCases: [
      { input: '3\n2 1 3', output: 'true', explanation: 'Valid BST.' },
      {
        input: '5\n5 1 4 null null 3 6',
        output: 'false',
        explanation: 'Root is 5 but right child root is 4.',
      },
    ],
    hiddenTestCases: [{ input: '1\n10', output: 'true' }],
  },
  {
    title: 'Lowest Common Ancestor of a BST',
    slug: 'lowest-common-ancestor-of-a-bst',
    statementMarkdown:
      'Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.',
    difficulty: 'medium',
    tags: ['Tree', 'Depth-First Search', 'Binary Search Tree', 'Binary Tree'],
    sampleTestCases: [
      { input: '6 2 8 0 4 7 9\n2 8', output: '6', explanation: 'LCA of 2 and 8 is 6.' },
      { input: '6 2 8 0 4 7 9\n2 4', output: '2', explanation: 'LCA of 2 and 4 is 2.' },
    ],
    hiddenTestCases: [{ input: '2 1\n2 1', output: '2' }],
  },
  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    statementMarkdown:
      'You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    difficulty: 'easy',
    tags: ['Math', 'Dynamic Programming', 'Memoization'],
    sampleTestCases: [
      { input: '2', output: '2', explanation: '1+1 or 2 steps.' },
      { input: '3', output: '3', explanation: '1+1+1, 1+2, or 2+1.' },
    ],
    hiddenTestCases: [
      { input: '5', output: '8' },
      { input: '10', output: '89' },
    ],
  },
  {
    title: 'House Robber',
    slug: 'house-robber',
    statementMarkdown:
      'You are a professional robber planning to rob houses along a street. Adjacent houses have security systems connected. Determine the maximum amount of money you can rob tonight without alerting the police.',
    difficulty: 'medium',
    tags: ['Array', 'Dynamic Programming'],
    sampleTestCases: [
      {
        input: '4\n1 2 3 1',
        output: '4',
        explanation: 'Rob house 1 (1) and house 3 (3), total = 4.',
      },
      {
        input: '5\n2 7 9 3 1',
        output: '12',
        explanation: 'Rob house 1 (2), house 3 (9), and house 5 (1), total = 12.',
      },
    ],
    hiddenTestCases: [{ input: '3\n2 1 1', output: '3' }],
  },
  {
    title: 'Coin Change',
    slug: 'coin-change',
    statementMarkdown:
      'You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money. Return the fewest number of coins that you need to make up that amount.',
    difficulty: 'medium',
    tags: ['Array', 'Dynamic Programming', 'Breadth-First Search'],
    sampleTestCases: [
      { input: '3\n1 2 5\n11', output: '3', explanation: '11 = 5 + 5 + 1 (3 coins).' },
      { input: '1\n2\n3', output: '-1', explanation: 'Cannot make 3 with 2-denomination coins.' },
    ],
    hiddenTestCases: [{ input: '1\n1\n0', output: '0' }],
  },
  {
    title: 'Longest Increasing Subsequence',
    slug: 'longest-increasing-subsequence',
    statementMarkdown:
      'Given an integer array `nums`, return the length of the longest strictly increasing subsequence in O(n log n) or O(n^2) time.',
    difficulty: 'medium',
    tags: ['Array', 'Binary Search', 'Dynamic Programming'],
    sampleTestCases: [
      {
        input: '8\n10 9 2 5 3 7 101 18',
        output: '4',
        explanation: 'The longest increasing subsequence is [2, 3, 7, 101], length 4.',
      },
    ],
    hiddenTestCases: [
      { input: '6\n0 1 0 3 2 3', output: '4' },
      { input: '7\n7 7 7 7 7 7 7', output: '1' },
    ],
  },
  {
    title: 'Number of Islands',
    slug: 'number-of-islands',
    statementMarkdown:
      'Given an `m x n` 2D binary grid `grid` which represents a map of 1s (land) and 0s (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
    difficulty: 'medium',
    tags: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Union Find', 'Matrix'],
    sampleTestCases: [
      {
        input: '4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0',
        output: '1',
        explanation: 'Single connected land mass.',
      },
    ],
    hiddenTestCases: [{ input: '4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1', output: '3' }],
  },
  {
    title: 'Course Schedule (Cycle Detection in Directed Graph)',
    slug: 'course-schedule',
    statementMarkdown:
      'There are a total of `numCourses` courses you have to take, labeled from 0 to `numCourses - 1`. You are given an array `prerequisites`. Return `true` if you can finish all courses. Otherwise, return `false` (Kahn topological sort).',
    difficulty: 'medium',
    tags: ['Depth-First Search', 'Breadth-First Search', 'Graph', 'Topological Sort'],
    sampleTestCases: [
      {
        input: '2 1\n1 0',
        output: 'true',
        explanation: 'To take course 1 you should take course 0. Feasible.',
      },
      { input: '2 2\n1 0\n0 1', output: 'false', explanation: 'Circular dependency cycle.' },
    ],
    hiddenTestCases: [{ input: '3 2\n0 1\n1 2', output: 'true' }],
  },
  {
    title: 'Jump Game',
    slug: 'jump-game',
    statementMarkdown:
      'You are given an integer array `nums`. You are initially positioned at the array first index, and each element in the array represents your maximum jump length at that position. Return `true` if you can reach the last index, or `false` otherwise.',
    difficulty: 'medium',
    tags: ['Array', 'Dynamic Programming', 'Greedy'],
    sampleTestCases: [
      {
        input: '5\n2 3 1 1 4',
        output: 'true',
        explanation: 'Jump 1 step from index 0 to 1, then 3 steps to the last index.',
      },
      {
        input: '5\n3 2 1 0 4',
        output: 'false',
        explanation: 'Will always arrive at index 3 where jump is 0.',
      },
    ],
    hiddenTestCases: [{ input: '1\n0', output: 'true' }],
  },
  {
    title: 'Merge Intervals',
    slug: 'merge-intervals',
    statementMarkdown:
      'Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    difficulty: 'medium',
    tags: ['Array', 'Sorting'],
    sampleTestCases: [
      {
        input: '4\n1 3\n2 6\n8 10\n15 18',
        output: '[[1,6],[8,10],[15,18]]',
        explanation: 'Intervals [1,3] and [2,6] overlap, merging into [1,6].',
      },
    ],
    hiddenTestCases: [{ input: '2\n1 4\n4 5', output: '[[1,5]]' }],
  },
  {
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    statementMarkdown:
      'Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    difficulty: 'hard',
    tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack', 'Monotonic Stack'],
    sampleTestCases: [
      {
        input: '12\n0 1 0 2 1 0 1 3 2 1 2 1',
        output: '6',
        explanation: '6 units of rain water are trapped between elevation bars.',
      },
      { input: '6\n4 2 0 3 2 5', output: '9', explanation: '9 units of water trapped.' },
    ],
    hiddenTestCases: [
      { input: '3\n2 0 2', output: '2' },
      { input: '4\n3 0 0 3', output: '6' },
    ],
  },
  {
    title: 'Median of Two Sorted Arrays',
    slug: 'median-of-two-sorted-arrays',
    statementMarkdown:
      'Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).',
    difficulty: 'hard',
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    sampleTestCases: [
      {
        input: '2\n1 3\n1\n2',
        output: '2.0',
        explanation: 'Merged array = [1,2,3] and median is 2.0.',
      },
      {
        input: '2\n1 2\n2\n3 4',
        output: '2.5',
        explanation: 'Merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.',
      },
    ],
    hiddenTestCases: [{ input: '2\n0 0\n2\n0 0', output: '0.0' }],
  },
];

export async function seedProblems() {
  await CodingProblem.deleteMany({});
  await CodingTestCase.deleteMany({});

  for (const prob of DSA_PROBLEMS) {
    const { hiddenTestCases, ...problemData } = prob;
    const created = await CodingProblem.create(problemData);

    // Seed test cases
    const testCasesToCreate = [
      ...created.sampleTestCases.map((s, idx) => ({
        problemId: created._id,
        input: s.input,
        expectedOutput: s.output,
        isHidden: false,
        order: idx + 1,
      })),
      ...(hiddenTestCases || []).map((h, idx) => ({
        problemId: created._id,
        input: h.input,
        expectedOutput: h.output,
        isHidden: true,
        order: created.sampleTestCases.length + idx + 1,
      })),
    ];

    await CodingTestCase.insertMany(testCasesToCreate);
  }

  return DSA_PROBLEMS.length;
}
