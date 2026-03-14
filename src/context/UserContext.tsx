import { createContext, useContext, ReactNode } from 'react';
import { TeamMember } from '../types';
import { useAuth } from './AuthContext';

interface UserContextType {
  currentUser: TeamMember | null;
  setCurrentUser: (user: TeamMember | null) => void;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  setCurrentUser: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { member } = useAuth();

  // currentUser is now driven by auth — setCurrentUser is a no-op kept for compatibility
  return (
    <UserContext.Provider value={{ currentUser: member, setCurrentUser: () => {} }}>
      {children}
    </UserContext.Provider>
  );
}

export const useCurrentUser = () => useContext(UserContext);
