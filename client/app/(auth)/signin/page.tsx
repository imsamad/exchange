"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthForm from "../../Components/AuthForm";
import { Suspense, useState } from "react";
import { flushSync } from "react-dom";

const SinginPage = () => {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const redirectTo = searchParams.get("redirectTo");

  if (status == "authenticated") {
    router.push(redirectTo ? redirectTo : "/");
  }
  const [error, setError] = useState("");

  const handleSigin = async (email: string, password: string) => {
    try {
      const res = await signIn("credentials", {
        email,
        password,
        callbackUrl: redirectTo ? redirectTo : "/",
        redirect: false,
      });

      // @ts-ignore
      if (res.ok) {
        window.location.href = redirectTo ? redirectTo : "/";
      } else {
        flushSync(() => {
          setError("");
        });
        setError("Provide valid credentials!");
      }
    } catch (err: any) {}
  };

  // if (status == "loading") return <div>Loading...</div>;

  return <AuthForm label="Signin" onSubmit={handleSigin} error={error} />;
};

export default SinginPage;
