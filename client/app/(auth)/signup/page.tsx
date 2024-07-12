"use client";

import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import AuthForm from "../../Components/AuthForm";
import { useState } from "react";

const SingUpPage = () => {
  const { status } = useSession();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirectTo");

  if (status == "authenticated")
    window.location.href = redirectTo ? redirectTo : "/";

  const [error, setError] = useState("");

  const handleSignup = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/signup", {
        body: JSON.stringify({ email, password }),
        method: "post",
      });

      const data = await res.json();

      if (res.ok)
        await signIn("credentials", {
          email,
          password,
          callbackUrl: redirectTo ? redirectTo : "/",
        });
      else setError(data.message);
    } catch (err: any) {}
  };

  // if (status == "loading") return <div>Loading...</div>;

  return <AuthForm label="Signup" onSubmit={handleSignup} error={error} />;
};

export default SingUpPage;
