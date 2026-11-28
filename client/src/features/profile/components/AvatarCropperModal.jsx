import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, ZoomIn, ZoomOut, Check, X, Image as ImageIcon } from 'lucide-react';
import { Modal, Button, useToast } from '../../../components/index.js';
import profileService from '../../../services/profile.service.js';

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
        (blob) => {
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
    image.onerror = (error) => reject(error);
  });
};

/**
 * Interactive WebP avatar upload and round crop modal for the EngineerOS Card.
 */
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (file.type && !allowedTypes.includes(file.type)) {
        showToast('Unsupported format. Please select PNG, JPG, or WebP.', 'error');
        return;
      }
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
    if (!imageSrc || !croppedAreaPixels) {
      showToast('Please wait for image cropper to finish loading', 'error');
      return;
    }
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
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {!imageSrc ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-surface-600 hover:border-brand-500 rounded-xl p-7 sm:p-8 transition-colors bg-elevated/55 text-center">
            <div className="w-14 h-14 rounded-full bg-card border border-surface-700 flex items-center justify-center text-surface-400 mb-3.5">
              <ImageIcon className="w-7 h-7" />
            </div>
            <p className="text-sm font-medium text-surface-100 mb-1">
              Choose an image from your computer
            </p>
            <p className="text-xs text-surface-400 mb-4">PNG, JPG, or WebP up to 3MB</p>
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white transition-colors shadow-xs">
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
            <div className="relative w-full h-64 bg-elevated rounded-xl overflow-hidden border border-surface-700">
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
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-elevated rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <ZoomIn className="w-4 h-4 text-surface-400 shrink-0" />
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-surface-700">
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
                  disabled={!croppedAreaPixels}
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
