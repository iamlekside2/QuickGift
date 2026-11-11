// "Please sign in to continue" for things a guest cannot do (wallet, chat,
// booking, checkout). Without this a guest reaches a signed-in-only endpoint,
// gets a 401 and sees a blank or broken screen.
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export function useRequireAuth() {
  const { isAuthenticated, isGuest, logout } = useAuth();
  const signedIn = !!isAuthenticated && !isGuest;

  /**
   * Returns true when the user is signed in. Otherwise shows the prompt and
   * returns false; "Sign in" leaves guest mode, which takes the user to the
   * sign-in screens.
   *
   * @param {string} [what]  One line saying what signing in unlocks.
   * @param {{ beforeSignIn?: () => void }} [opts]  Run just before leaving
   *   guest mode (for example to close a modal screen first).
   */
  const requireAuth = (what, opts = {}) => {
    if (signedIn) return true;
    Alert.alert(
      'Please sign in to continue',
      what || 'Create an account or sign in to use this.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Sign in',
          onPress: () => {
            try {
              opts.beforeSignIn?.();
            } catch {}
            logout();
          },
        },
      ],
    );
    return false;
  };

  return { signedIn, requireAuth };
}

export default useRequireAuth;
