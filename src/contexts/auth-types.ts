export type UserRole = 'job_seeker' | 'recruiter' | 'admin' | 'USER' | 'INTERVIEWER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  profile_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AuthError {
  message: string;
}

export interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    userData: { full_name: string; role: UserRole },
  ) => Promise<{ error: AuthError | null }>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  updateProfile: (
    updates: Partial<UserProfile>,
  ) => Promise<{ error: Error | null }>
}