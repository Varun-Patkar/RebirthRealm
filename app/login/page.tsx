'use client';

import { signIn, getSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NebulaBackground } from '@/components/ui/nebula-background';
import { GlassCard } from '@/components/ui/glass-card';
import { MysticalButton } from '@/components/ui/mystical-button';
import { Github, Sparkles, Scroll } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    
    checkSession();
  }, [router]);

  const handleGithubSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('github', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <NebulaBackground />
      
      <div className="w-full max-w-md">
        <GlassCard className="p-8 text-center" glow>
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Scroll className="w-16 h-16 text-purple-400" />
                <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-teal-400 to-yellow-400 bg-clip-text text-transparent mb-2">
              RebirthRealm
            </h1>
            
            <p className="text-gray-300 text-lg">
              Enter the mystical realm of infinite sagas
            </p>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-400 mb-4">
                Sign in with GitHub to begin your journey
              </p>
            </div>

            <MysticalButton 
              onClick={handleGithubSignIn}
              disabled={isLoading}
              className="w-full"
              size="lg"
              glow
            >
              <Github className="w-5 h-5 mr-2" />
              {isLoading ? 'Entering the Realm...' : 'Continue with GitHub'}
            </MysticalButton>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Create, explore, and share your epic sagas
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}