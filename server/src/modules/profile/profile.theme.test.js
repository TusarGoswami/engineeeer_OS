import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CANONICAL_CARD_THEMES,
  normalizeCardTheme,
  updateProfileSettingsSchema,
} from './profile.schema.js';
import { updateProfileSchema } from '../users/user.schema.js';
import { User } from '../users/user.model.js';
import { ProfileService } from './profile.service.js';
import { ProfileRepository } from './profile.repository.js';
import { ProfileSnapshotService } from './profileSnapshot.service.js';

describe('Profile Card Themes Schema & Compatibility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('defines canonical identifiers for all five visual aesthetics themes', () => {
    expect(CANONICAL_CARD_THEMES).toEqual([
      'terminal',
      'minimalist',
      'silicon',
      'varsity',
      'blueprint',
    ]);
  });

  it('validates all five canonical themes and transforms legacy brutal to blueprint in both schemas', () => {
    for (const theme of CANONICAL_CARD_THEMES) {
      const profileParsed = updateProfileSettingsSchema.parse({
        profileSettings: { theme },
      });
      const userParsed = updateProfileSchema.parse({
        profileSettings: { theme },
      });

      expect(profileParsed.profileSettings.theme).toBe(theme);
      expect(userParsed.profileSettings.theme).toBe(theme);
    }

    const legacyProfile = updateProfileSettingsSchema.parse({
      profileSettings: { theme: 'brutal' },
    });
    const legacyUser = updateProfileSchema.parse({
      profileSettings: { theme: 'brutal' },
    });

    expect(legacyProfile.profileSettings.theme).toBe('blueprint');
    expect(legacyUser.profileSettings.theme).toBe('blueprint');

    expect(() =>
      updateProfileSettingsSchema.parse({ profileSettings: { theme: 'unknown_theme' } })
    ).toThrow();
  });

  it('allows both blueprint and legacy brutal in User Mongoose enum', () => {
    const enumValues = User.schema.path('profileSettings.theme').enumValues;
    expect(enumValues).toEqual(
      expect.arrayContaining(['terminal', 'minimalist', 'silicon', 'varsity', 'blueprint', 'brutal'])
    );
  });

  it('normalizes legacy brutal theme in ProfileService retrieval and update flows', async () => {
    expect(normalizeCardTheme('brutal')).toBe('blueprint');
    expect(normalizeCardTheme('blueprint')).toBe('blueprint');
    expect(normalizeCardTheme('invalid')).toBe('terminal');

    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'alexj',
      profileSettings: {
        theme: 'brutal',
        visibility: 'public',
        shareToken: 'tok_123',
      },
    };
    const mockSnapshot = {
      identity: { username: 'alexj', avatarKey: '' },
      stats: {},
    };

    vi.spyOn(ProfileRepository, 'findUserById').mockResolvedValue(mockUser);
    vi.spyOn(ProfileRepository, 'findUserByUsername').mockResolvedValue(mockUser);
    vi.spyOn(ProfileRepository, 'findSnapshotByUserId').mockResolvedValue(mockSnapshot);
    vi.spyOn(ProfileRepository, 'updateUser').mockResolvedValue({
      ...mockUser,
      profileSettings: { ...mockUser.profileSettings, theme: 'blueprint' },
    });
    vi.spyOn(ProfileSnapshotService, 'rebuildSnapshot').mockResolvedValue(mockSnapshot);

    const owner = await ProfileService.getOwnerProfile(mockUser._id);
    expect(owner.settings.theme).toBe('blueprint');

    const updated = await ProfileService.updateOwnerProfile(mockUser._id, {
      profileSettings: { theme: 'blueprint' },
    });
    expect(ProfileRepository.updateUser).toHaveBeenCalledWith(
      mockUser._id,
      expect.objectContaining({
        profileSettings: expect.objectContaining({ theme: 'blueprint' }),
      })
    );
    expect(updated.settings.theme).toBe('blueprint');

    const pub = await ProfileService.getPublicProfile('alexj');
    expect(pub.theme).toBe('blueprint');
  });
});

