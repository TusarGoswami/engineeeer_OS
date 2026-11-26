import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Lock,
  ArrowLeft,
  Share2,
  Sparkles,
} from 'lucide-react';
import profileService from '../../services/profile.service.js';
import ProfileCard from './components/ProfileCard.jsx';
import CardExportModal from './components/CardExportModal.jsx';
import { Button, Card, CardSkeleton, ThemeToggle } from '../../components/index.js';

/**
 * Publicly shareable EngineerOS card route (/u/:username) supporting unlisted ?token access.
 */
export const PublicProfilePage = () => {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await profileService.getPublicProfile(username, token);
        if (isMounted) {
          setProfile(data);
          document.title = `${data.name || username} | EngineerOS Profile`;

          if (data.profileSettings?.visibility === 'unlisted') {
            let metaRobots = document.querySelector('meta[name="robots"]');
            if (!metaRobots) {
              metaRobots = document.createElement('meta');
              metaRobots.name = 'robots';
              document.head.appendChild(metaRobots);
            }
            metaRobots.content = 'noindex, nofollow';
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              'This profile is private or does not exist.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPublicProfile();

    return () => {
      isMounted = false;
    };
  }, [username, token]);

  return (
    <div className="min-h-screen bg-canvas text-surface-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white bg-grid-cyber">
      {/* Top Navbar */}
      <header className="border-b border-surface-700 bg-navbar/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-display font-bold text-surface-100 text-sm hover:opacity-90 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center font-display font-bold text-xs text-white shadow-xs">
              OS
            </div>
            <span>
              Engineer<span className="text-brand-500">OS</span>
            </span>
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle size="sm" />
            <Link to="/register">
              <Button size="sm" variant="primary" leftIcon={Sparkles}>
                Create Your Card
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10">
        {loading ? (
          <div className="w-full max-w-3xl">
            <CardSkeleton lines={5} />
          </div>
        ) : error ? (
          <Card className="w-full max-w-md mx-auto text-center p-7 sm:p-8 shadow-[var(--shadow-elevated)] space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-display text-lg font-bold text-surface-100">Profile Restricted</h2>
            <p className="text-sm text-surface-400 leading-relaxed">{error}</p>
            <div className="pt-2">
              <Link to="/">
                <Button variant="secondary" size="sm" leftIcon={ArrowLeft}>
                  Back to EngineerOS
                </Button>
              </Link>
            </div>
          </Card>
        ) : profile ? (
          <div className="w-full max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <span className="text-xs text-surface-400">
                Viewing public profile of{' '}
                <strong className="font-mono text-surface-200">@{username}</strong>
              </span>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={Share2}
                onClick={() => setIsExportOpen(true)}
              >
                Share / Export
              </Button>
            </div>

            <div className="flex justify-center">
              <ProfileCard
                ref={cardRef}
                profile={profile}
                orientation="portrait"
                className="w-full max-w-md"
              />
            </div>

            <CardExportModal
              isOpen={isExportOpen}
              onClose={() => setIsExportOpen(false)}
              cardElementRef={cardRef}
              profile={profile}
            />
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-700 bg-navbar/70 py-5 text-center font-mono text-xs text-surface-400">
        <p>EngineerOS — The Complete Operating System for Engineering Students</p>
      </footer>
    </div>
  );
};

export default PublicProfilePage;
