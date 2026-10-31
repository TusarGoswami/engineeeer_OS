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
import Button from '../../components/Button.jsx';
import { CardSkeleton } from '../../components/Skeleton.jsx';

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
          // Set page title
          document.title = `${data.name || username} | EngineerOS Profile`;

          // Handle noindex for unlisted profiles
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
    <div className="min-h-screen bg-[#07090E] text-surface-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Top Banner */}
      <header className="border-b border-surface-800/80 bg-surface-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold text-white text-sm hover:opacity-90 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-xs shadow-md shadow-brand-600/30">
              OS
            </div>
            <span>EngineerOS</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/register">
              <Button size="sm" variant="primary" leftIcon={Sparkles}>
                Create Your Card
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10">
        {loading ? (
          <div className="w-full max-w-2xl space-y-4">
            <CardSkeleton />
          </div>
        ) : error ? (
          <div className="w-full max-w-md mx-auto text-center p-8 rounded-2xl bg-surface-900/60 border border-surface-800 shadow-2xl backdrop-blur-md space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Profile Restricted</h2>
            <p className="text-sm text-surface-400 leading-relaxed">{error}</p>
            <div className="pt-2">
              <Link to="/">
                <Button variant="secondary" size="sm" leftIcon={ArrowLeft}>
                  Back to EngineerOS
                </Button>
              </Link>
            </div>
          </div>
        ) : profile ? (
          <div className="w-full max-w-2xl space-y-4">
            {/* Action Bar */}
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-surface-400">
                Viewing public profile of{' '}
                <strong className="text-surface-200">@{username}</strong>
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

            {/* Profile Card */}
            <div className="flex justify-center">
              <ProfileCard ref={cardRef} profile={profile} />
            </div>

            {/* Export Modal */}
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
      <footer className="border-t border-surface-800/80 bg-surface-950/40 py-6 text-center text-xs text-surface-500">
        <p>
          EngineerOS — The Complete Operating System for Engineering Students
        </p>
      </footer>
    </div>
  );
};

export default PublicProfilePage;

