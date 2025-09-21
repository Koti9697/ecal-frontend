import { useAppSelector } from '../store/hooks';
import { type RootState } from '../store/store';

/**
 * A custom hook to check if the current user has at least one of the specified privileges.
 * @param requiredPrivileges An array of privilege names.
 * @returns boolean - True if the user has a required privilege, false otherwise.
 */
export function useHasPrivilege(requiredPrivileges: string[]): boolean {
  const user = useAppSelector((state: RootState) => state.auth.user);

  if (!user || !user.privileges) {
    return false;
  }

  // Check if any of the user's privileges are included in the list of required ones.
  return user.privileges.some(userPriv => requiredPrivileges.includes(userPriv));
}