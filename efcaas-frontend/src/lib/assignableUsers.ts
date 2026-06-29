import type { PermissionProfile, UserProfile } from '../types';

export function getAssignableUsers(
  users: UserProfile[],
  permissionProfiles: PermissionProfile[],
): UserProfile[] {
  return users.filter((u) => {
    const profile = permissionProfiles.find((p) => p.id === u.profileId);
    if (!profile) return false;
    return (
      profile.permissions.includes('perform_analysis') ||
      profile.permissions.includes('view_analysis')
    );
  });
}
