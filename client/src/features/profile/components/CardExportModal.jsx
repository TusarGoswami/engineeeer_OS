import { useState } from 'react';
import { toPng, toBlob } from 'html-to-image';
import {
  Download,
  Copy,
  Check,
  Share2,
  Linkedin,
  Twitter,
  MessageCircle,
} from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Button from '../../../components/Button.jsx';
import { useToast } from '../../../components/Toast.jsx';

export const CardExportModal = ({
  isOpen,
  onClose,
  cardElementRef,
  profile,
}) => {
  const { showToast } = useToast();
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const username =
    profile?.identity?.username || profile?.username || 'engineer';
  const visibility = profile?.profileSettings?.visibility || 'public';
  const shareToken = profile?.shareToken;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${baseUrl}/u/${username}${
    visibility === 'unlisted' && shareToken ? `?token=${shareToken}` : ''
  }`;

  const shareText = `Check out my engineering portfolio & consistency stats on EngineerOS! #EngineerOS #BuildInPublic`;

  const handleDownloadPng = async () => {
    if (!cardElementRef.current) {
      showToast('Card element reference not found', 'error');
      return;
    }
    try {
      setIsExportingPng(true);
      const dataUrl = await toPng(cardElementRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0A0F1D',
      });
      const link = document.createElement('a');
      link.download = `engineeros-${username}-card.png`;
      link.href = dataUrl;
      link.click();
      showToast('Card downloaded as high-res PNG', 'success');
    } catch {
      showToast('Failed to export image', 'error');
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleCopyImage = async () => {
    if (!cardElementRef.current) return;
    try {
      setIsCopyingImage(true);
      const blob = await toBlob(cardElementRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0A0F1D',
      });
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new window.ClipboardItem({ 'image/png': blob }),
        ]);
        showToast('Card image copied to clipboard', 'success');
      } else {
        showToast('Image clipboard copying not supported on this browser', 'error');
      }
    } catch {
      showToast('Failed to copy image to clipboard', 'error');
    } finally {
      setIsCopyingImage(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    showToast('Share link copied to clipboard', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username}'s EngineerOS Card`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          showToast('Failed to share', 'error');
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      shareText + ' ' + shareUrl
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share & Export Profile Card"
      description="Download high-resolution card or share your engineering journey online"
      size="md"
    >
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="primary"
            onClick={handleDownloadPng}
            isLoading={isExportingPng}
            leftIcon={Download}
            className="w-full justify-center"
          >
            Download PNG (2x)
          </Button>

          <Button
            variant="secondary"
            onClick={handleCopyImage}
            isLoading={isCopyingImage}
            leftIcon={Copy}
            className="w-full justify-center"
          >
            Copy Image
          </Button>
        </div>

        {/* Share Link Box */}
        <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-surface-400">
            <span>Direct Public Link</span>
            {visibility === 'unlisted' && (
              <span className="text-amber-400 text-[10px] uppercase font-semibold">
                Secret Token Included
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              className="w-full text-xs font-mono bg-surface-900 border border-surface-700/60 rounded-lg px-2.5 py-2 text-surface-300 select-all"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyLink}
              leftIcon={copiedLink ? Check : Copy}
            >
              {copiedLink ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Social Sharing Intents */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-surface-300 uppercase tracking-wider">
            Share Directly
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={shareToLinkedIn}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-surface-800 bg-surface-900 hover:bg-surface-800/80 text-surface-200 text-xs font-medium transition-colors"
            >
              <Linkedin className="w-4 h-4 text-[#0A66C2]" />
              <span>LinkedIn</span>
            </button>

            <button
              type="button"
              onClick={shareToTwitter}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-surface-800 bg-surface-900 hover:bg-surface-800/80 text-surface-200 text-xs font-medium transition-colors"
            >
              <Twitter className="w-4 h-4 text-sky-400" />
              <span>Twitter / X</span>
            </button>

            <button
              type="button"
              onClick={shareToWhatsApp}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-surface-800 bg-surface-900 hover:bg-surface-800/80 text-surface-200 text-xs font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Native Web Share fallback */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNativeShare}
            leftIcon={Share2}
            className="w-full justify-center text-surface-400"
          >
            Open Device Share Sheet
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default CardExportModal;

