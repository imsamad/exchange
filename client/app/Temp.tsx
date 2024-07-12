"use client";
import { Button, Heading } from "@radix-ui/themes";
import { signOut, useSession } from "next-auth/react";
import React from "react";

const Temp = () => {
  const { status, data } = useSession();
  return (
    <div className="w-[400px] mx-auto">
      <Heading size="7">{JSON.stringify(data, null, 4)}</Heading>
      <Button
        onClick={async () => {
          await signOut();
          window.location.href = "/signin";
        }}
      >
        Logout
      </Button>
    </div>
  );
};

export default Temp;
