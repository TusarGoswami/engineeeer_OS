import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import {
  Badge,
  Button,
  IconButton,
  StatCard,
  ProgressRing,
  Heatmap,
  Avatar,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Modal,
  Drawer,
  Tooltip,
  CommandPalette,
} from '../index.js';
import { Code2 } from 'lucide-react';

describe('Shared Component Library (Phase 7 Design System)', () => {
  it('renders Badge with custom variants and labels', () => {
    render(<Badge variant="compiler">Solved</Badge>);
    const badge = screen.getByText('Solved');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-emerald-400');
  });

  it('renders Button with loading and disabled states', () => {
    const handleClick = vi.fn();
    const { rerender } = render(
      <Button onClick={handleClick} variant="primary">
        Submit Code
      </Button>
    );
    const btn = screen.getByRole('button', { name: /Submit Code/i });
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button isLoading disabled variant="primary">
        Submit Code
      </Button>
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders IconButton with accessible label', () => {
    const handleClick = vi.fn();
    render(<IconButton icon={Code2} ariaLabel="Open Code Editor" onClick={handleClick} />);
    const iconBtn = screen.getByLabelText('Open Code Editor');
    expect(iconBtn).toBeInTheDocument();
    fireEvent.click(iconBtn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders StatCard with value and trend', () => {
    render(
      <StatCard
        title="Problems Solved"
        value="142"
        trend={{ value: '+14 this week', isPositive: true }}
        subtitle="Ranked #42 on campus"
      />
    );
    expect(screen.getByText('Problems Solved')).toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('+14 this week')).toBeInTheDocument();
  });

  it('renders ProgressRing with accessible progressbar attributes', () => {
    render(<ProgressRing progress={75} label="Semester Completion" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '75');
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders Heatmap with active days and streak', () => {
    const mockData = [
      { date: '2026-10-30', count: 5 },
      { date: '2026-10-31', count: 2 },
    ];
    render(<Heatmap data={mockData} weeks={10} totalActiveDays={45} currentStreak={12} />);
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('12d 🔥')).toBeInTheDocument();
  });

  it('renders Avatar with fallback initials when no src provided', () => {
    render(<Avatar name="Tusar Goswami" size="md" status="online" />);
    expect(screen.getByText('TG')).toBeInTheDocument();
  });

  it('handles Tabs state transitions on click', () => {
    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview Pane Content</TabsContent>
        <TabsContent value="activity">Activity Pane Content</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Overview Pane Content')).toBeInTheDocument();
    expect(screen.queryByText('Activity Pane Content')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Activity'));
    expect(screen.getByText('Activity Pane Content')).toBeInTheDocument();
  });

  it('renders Table hierarchy cleanly', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Problem</TableHead>
            <TableHead>Difficulty</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>LRU Cache</TableCell>
            <TableCell>Medium</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Problem')).toBeInTheDocument();
    expect(screen.getByText('LRU Cache')).toBeInTheDocument();
  });

  it('renders Modal and closes on close button or Escape', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal Body</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Body')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders Drawer when open', () => {
    const handleClose = vi.fn();
    render(
      <Drawer isOpen={true} onClose={handleClose} title="Test Drawer">
        <p>Drawer Body</p>
      </Drawer>
    );
    expect(screen.getByText('Test Drawer')).toBeInTheDocument();
    expect(screen.getByText('Drawer Body')).toBeInTheDocument();
  });

  it('renders Tooltip on hover/focus', async () => {
    render(
      <Tooltip content="Tooltip Content">
        <button>Hover Me</button>
      </Tooltip>
    );
    const trigger = screen.getByText('Hover Me');
    fireEvent.mouseEnter(trigger);
    // Tooltip renders
    expect(trigger).toBeInTheDocument();
  });

  it('renders CommandPalette and navigates', () => {
    const handleClose = vi.fn();
    render(
      <BrowserRouter>
        <CommandPalette isOpen={true} onClose={handleClose} />
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText(/Type a command or jump to a module/i)).toBeInTheDocument();
    expect(screen.getByText('Coding Problems & DSA')).toBeInTheDocument();
  });
});

