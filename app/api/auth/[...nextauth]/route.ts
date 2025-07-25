import NextAuth from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Define proper types for NextAuth
declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }

  interface User {
    id?: string;
    _id?: string | ObjectId;
  }
}

const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github') {
        try {
          const db = await getDatabase();
          const users = db.collection('users');

          const existingUser = await users.findOne({ githubId: (profile as any)?.id });

          if (!existingUser) {
            const result = await users.insertOne({
              email: user.email!,
              name: user.name!,
              image: user.image,
              githubId: (profile as any)?.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            // Attach the newly created ID to the user object
            user.id = result.insertedId.toString();
          } else {
            await users.updateOne(
              { githubId: (profile as any)?.id },
              {
                $set: {
                  email: user.email!,
                  name: user.name!,
                  image: user.image,
                  updatedAt: new Date(),
                }
              }
            );
            // Attach the existing ID to the user object
            user.id = existingUser._id.toString();
          }

          return true;
        } catch (error) {
          console.error('Error saving user to database:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // Persist the user id to the token
      if (user) {
        token.userId = user.id || user._id?.toString();
      }
      return token;
    },
    async session({ session, token }) {
      // Send the user ID to the client
      if (token.userId) {
        if (session.user) {
          session.user.id = token.userId as string;
        }
      } else if (session.user?.email) {
        try {
          // Fallback to lookup by email if token doesn't have the ID
          const db = await getDatabase();
          const users = db.collection('users');
          const user = await users.findOne({ email: session.user.email });

          if (user && session.user) {
            session.user.id = user._id.toString();
          }
        } catch (error) {
          console.error('Error fetching user from database:', error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});

export { handler as GET, handler as POST };