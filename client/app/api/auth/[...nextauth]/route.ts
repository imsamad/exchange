import { pgPool } from "@/app/pg";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        let password = credentials?.password;

        try {
          const data = await pgPool.query(
            `SELECT * FROM users where email=$1`,
            [email]
          );

          if (!data.rowCount) return null;

          if (
            password &&
            (await bcrypt.compare(password, data.rows[0].password))
          ) {
            const jwtToken = jwt.sign(
              { id: data.rows[0].id },
              process.env.JWT_SECRET as string
            );

            return { email, id: data.rows[0].id as string, jwtToken };
          } else return null;
        } catch (err) {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    jwt: async (jwtProps) => {
      const { account, token, user, profile, session, trigger } = jwtProps;

      // @ts-ignore
      if (user?.jwtToken) token.jwtToken = user.jwtToken;

      // token and session as null -> in case of CredentialProvider

      return token;
    },
    async session(sessionProps: any) {
      const { session, token, user, newSession, trigger } = sessionProps;
      // token and session -> in case of CredentialProvider
      // token if strategry is jwt, and user if strategy is database
      //

      // Send properties to the client, like an access_token from a provider.
      session.jwtToken = token.jwtToken;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
