import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TeamMember } from '../types';

interface UserContextType {
  currentUser: TeamMember | null;
  setCurrentUser: (user: TeamMember | null) => void;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  setCurrentUser: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<TeamMember | null>(() => {
    try {
      const stored = localStorage.getItem('crm_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setCurrentUser = (user: TeamMember | null) => {
    setCurrentUserState(user);
    if (user) localStorage.setItem('crm_current_user', JSON.stringify(user));
    else localStorage.removeItem('crm_current_user');
  };

  useEffect(() => {
    // Sync localStorage if user data changes
    if (currentUser) {
      localStorage.setItem('crm_current_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useCurrentUser = () => useContext(UserContext);
