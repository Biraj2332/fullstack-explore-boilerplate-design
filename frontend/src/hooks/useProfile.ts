import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usersApi } from '@/api/users.api';
import type { UpdateProfilePayload } from '@/types';

export const PROFILE_KEYS = {
  mine: ['profile', 'me'] as const,
  byId: (id: string) => ['profile', id] as const,
};

export function useMyProfile() {
  return useQuery({
    queryKey: PROFILE_KEYS.mine,
    queryFn: usersApi.getMyProfile,
    retry: false,
  });
}

export function useProfile(id: string) {
  return useQuery({
    queryKey: PROFILE_KEYS.byId(id),
    queryFn: () => usersApi.getUserById(id),
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => usersApi.updateProfile(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROFILE_KEYS.mine });
      toast.success('Profile updated!');
    },
    onError: () => toast.error('Failed to update profile'),
  });
}
