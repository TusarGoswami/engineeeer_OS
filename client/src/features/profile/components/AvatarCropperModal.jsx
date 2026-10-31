import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, ZoomIn, ZoomOut, Check, X, Image as ImageIcon } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Button from '../../../components/Button.jsx';
import { useToast } from '../../../components/Toast.jsx';
import profileService from '../../../services/profile.service.js';

// Helper to create cropped image canvas
const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        'image/webp',
        0.92
      );
    };
    image.onerror = error => reject(error);
  });
};

export const AvatarCropperModal = ({ isOpen, onClose, onAvatarUpdated }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileChange = e => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 3 * 1024 * 1024) {
        showToast('Image size exceeds 3MB limit', 'error');
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([croppedBlob], 'avatar.webp', { type: 'image/webp' });
      const result = await profileService.uploadAvatar(file);

      showToast('Avatar updated successfully', 'success');
      if (onAvatarUpdated) {
        onAvatarUpdated(result);
      }
      handleClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload avatar', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Update Profile Photo"
      description="Crop and adjust your avatar for your EngineerOS Card"
      size="md"
    >
      <div className="space-y-4">
        {!imageSrc ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-surface-700 hover:border-brand-500 rounded-2xl p-8 transition-colors bg-surface-900/50">
            <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center text-surface-400 mb-4">
              <ImageIcon className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium text-surface-200 mb-1">
              Choose an image from your computer
            </p>
            <p className="text-xs text-surface-400 mb-4">PNG, JPG, or WebP up to 3MB</p>
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg shadow-brand-600/20">
                <Upload className="w-4 h-4" /> Browse Photo
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative w-full h-64 bg-surface-950 rounded-2xl overflow-hidden border border-surface-800">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="flex items-center gap-3 px-2">
              <ZoomOut className="w-4 h-4 text-surface-400 shrink-0" />
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.05}
                aria-label="Zoom"
                onChange={e => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <ZoomIn className="w-4 h-4 text-surface-400 shrink-0" />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-surface-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImageSrc(null)}
                leftIcon={X}
                disabled={isUploading}
              >
                Choose Different
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleClose} disabled={isUploading}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  isLoading={isUploading}
                  leftIcon={Check}
                >
                  Save Photo
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AvatarCropperModal;

