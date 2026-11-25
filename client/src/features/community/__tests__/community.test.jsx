import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '../../../context/ThemeContext.jsx';
import ToastProvider from '../../../components/Toast.jsx';
import { CommunityForumPage } from '../CommunityForumPage.jsx';
import { PostDetailPage } from '../PostDetailPage.jsx';
import { communityService } from '../../../services/community.service.js';

vi.mock('../../auth/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: {
      _id: 'stud-1',
      name: 'Alex Johnson',
      role: 'student',
    },
  }),
}));

vi.mock('../../../services/community.service.js', () => ({
  communityService: {
    getPosts: vi.fn(),
    createPost: vi.fn(),
    getPostById: vi.fn(),
    getReplies: vi.fn(),
    addReply: vi.fn(),
    upvotePost: vi.fn(),
    upvoteReply: vi.fn(),
    acceptReply: vi.fn(),
  },
}));

const mockPostsFeed = [
  {
    _id: 'post-1',
    title: 'How should juniors prepare for distributed systems LLD rounds?',
    content: 'Looking for **Raft** consensus and **Consistent Hashing** patterns.',
    authorId: {
      _id: 'stud-1',
      name: 'Alex Johnson',
      role: 'student',
      university: 'MIT',
    },
    category: 'Placements',
    tags: ['distributed-systems', 'lld'],
    isAskSenior: true,
    upvoteCount: 18,
    upvotes: [],
    repliesCount: 2,
    isResolved: false,
    createdAt: '2026-11-24T10:00:00Z',
  },
  {
    _id: 'post-2',
    title: 'Deep dive on Belady Anomaly in FIFO paging',
    content: 'LRU avoids Belady anomaly because it satisfies stack property.',
    authorId: {
      _id: 'sen-1',
      name: 'Sneha Rao',
      username: 'sneharao',
      role: 'senior',
      isAlumni: true,
      university: 'IISc Bangalore',
      profile: { currentCompany: 'Stripe' },
    },
    category: 'GATE Prep',
    tags: ['gate-cs', 'os'],
    isAskSenior: false,
    upvoteCount: 27,
    upvotes: [],
    repliesCount: 5,
    isResolved: true,
    createdAt: '2026-11-23T08:00:00Z',
  },
];

const mockPostWithReplies = {
  ...mockPostsFeed[0],
  replies: [
    {
      _id: 'rep-1',
      postId: 'post-1',
      content: 'Start with **DDIA**.\n```python\ndef elect():\n    return True\n```',
      authorId: {
        _id: 'sen-1',
        name: 'Sneha Rao',
        username: 'sneharao',
        role: 'senior',
        isAlumni: true,
        university: 'IISc Bangalore',
      },
      upvoteCount: 6,
      upvotes: [],
      isAccepted: false,
      createdAt: '2026-11-24T12:00:00Z',
    },
  ],
};

function renderCommunity(initialRoute) {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/community" element={<CommunityForumPage />} />
            <Route path="/community/:id" element={<PostDetailPage />} />
            <Route path="/u/:username" element={<div>Public Member Profile</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

describe('Community Module (Module 8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn() },
      configurable: true,
    });
  });

  it('renders CommunityForumPage feed, discovery filters/sorting, bookmarks, upvotes, sharing, and creates a post', async () => {
    communityService.getPosts.mockResolvedValue({ data: mockPostsFeed });
    communityService.upvotePost.mockResolvedValue({
      data: { postId: 'post-1', upvoteCount: 19, hasUpvoted: true },
    });
    communityService.createPost.mockResolvedValue({
      data: { _id: 'post-3', title: 'New Systems Thread' },
    });

    renderCommunity('/community');

    await waitFor(() => {
      expect(communityService.getPosts).toHaveBeenCalledWith({});
    });

    expect(screen.getByText('Senior-Junior Community Network')).toBeInTheDocument();
    expect(screen.getByText('Deep dive on Belady Anomaly in FIFO paging')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sneha Rao' })).toHaveAttribute('href', '/u/sneharao');

    // Upvote post using Mongo upvoteCount response
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Upvote How should juniors prepare for distributed systems LLD rounds?',
      })
    );
    await waitFor(() => {
      expect(communityService.upvotePost).toHaveBeenCalledWith('post-1');
    });
    expect(await screen.findByText('19')).toBeInTheDocument();

    // Bookmark & Share
    const bookmarkButtons = screen.getAllByRole('button', { name: 'Bookmark discussion' });
    fireEvent.click(bookmarkButtons[0]);
    expect(screen.getByRole('button', { name: 'Saved (1)' })).toBeInTheDocument();

    const shareButtons = screen.getAllByRole('button', { name: 'Share discussion link' });
    fireEvent.click(shareButtons[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/community/post-1')
    );

    // Client sorting by Most Upvoted puts post-2 (27) before post-1 (19)
    fireEvent.change(screen.getByLabelText('Sort discussions'), { target: { value: 'top' } });
    const headings = screen.getAllByRole('heading', { level: 3 }).map((el) => el.textContent);
    expect(headings[0]).toBe('Deep dive on Belady Anomaly in FIFO paging');

    // Category filter -> Ask a Senior
    fireEvent.click(screen.getByRole('button', { name: 'Ask a Senior' }));
    await waitFor(() => {
      expect(communityService.getPosts).toHaveBeenLastCalledWith({ isAskSenior: 'true' });
    });

    // Open Create Discussion Modal with Markdown Preview & publish
    fireEvent.click(screen.getByRole('button', { name: 'New Discussion' }));
    fireEvent.change(screen.getByLabelText('Discussion Title'), {
      target: { value: 'Understanding B+ Tree Split Mechanics' },
    });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'System Design' } });
    fireEvent.change(screen.getByLabelText('Tags (comma separated)'), {
      target: { value: 'DBMS, Indexing' },
    });
    fireEvent.change(screen.getByLabelText('Description / Question Details'), {
      target: { value: 'How do leaf pointers stay linked?' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /Ask a Senior:/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Publish Post' }));

    await waitFor(() => {
      expect(communityService.createPost).toHaveBeenCalledWith({
        title: 'Understanding B+ Tree Split Mechanics',
        content: 'How do leaf pointers stay linked?',
        category: 'System Design',
        tags: ['dbms', 'indexing'],
        isAskSenior: true,
      });
    });
  });

  it('renders PostDetailPage Markdown/code blocks, reactions, reply live preview, solution acceptance, and reply submission', async () => {
    communityService.getPostById.mockResolvedValue({ data: mockPostWithReplies });
    communityService.upvotePost.mockResolvedValue({
      data: { postId: 'post-1', upvoteCount: 19, hasUpvoted: true },
    });
    communityService.upvoteReply.mockResolvedValue({
      data: { replyId: 'rep-1', upvoteCount: 7, hasUpvoted: true },
    });
    communityService.acceptReply.mockResolvedValue({
      data: { postId: 'post-1', acceptedReplyId: 'rep-1', isResolved: true },
    });
    communityService.addReply.mockResolvedValue({
      data: {
        _id: 'rep-2',
        content: 'Follow up question on quorum writes.',
        authorId: { _id: 'stud-1', name: 'Alex Johnson', role: 'student' },
        upvoteCount: 0,
        isAccepted: false,
        createdAt: '2026-11-24T13:00:00Z',
      },
    });

    renderCommunity('/community/post-1');

    expect(
      await screen.findByRole('heading', {
        name: 'How should juniors prepare for distributed systems LLD rounds?',
      })
    ).toBeInTheDocument();

    // Markdown & code block from reply rendered cleanly
    expect(screen.getByText('DDIA')).toBeInTheDocument();
    expect(screen.getByText('python')).toBeInTheDocument();

    // Emoji reaction & reply upvote
    fireEvent.click(screen.getByRole('button', { name: 'React 💡 to reply' }));
    expect(screen.getByRole('button', { name: 'React 💡 to reply' })).toHaveTextContent('1');

    fireEvent.click(screen.getByRole('button', { name: 'Upvote reply by Sneha Rao' }));
    await waitFor(() => {
      expect(communityService.upvoteReply).toHaveBeenCalledWith('rep-1');
    });
    expect(await screen.findByText('7')).toBeInTheDocument();

    // Post author marks solution as accepted
    fireEvent.click(screen.getByRole('button', { name: 'Accept as Solution' }));
    await waitFor(() => {
      expect(communityService.acceptReply).toHaveBeenCalledWith('post-1', 'rep-1');
    });
    expect(await screen.findByText('Accepted Best Answer')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();

    // Write & preview reply, then publish
    const replyInput = screen.getByLabelText('Write a Mentorship / Peer Response');
    fireEvent.change(replyInput, { target: { value: '**Follow up** question on quorum writes.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Live Preview' }));
    expect(screen.getByText('Follow up')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Write' }));

    fireEvent.click(screen.getByRole('button', { name: 'Post Reply' }));
    await waitFor(() => {
      expect(communityService.addReply).toHaveBeenCalledWith('post-1', {
        content: '**Follow up** question on quorum writes.',
      });
    });
    expect(await screen.findByText('Follow up question on quorum writes.')).toBeInTheDocument();
  });
});

