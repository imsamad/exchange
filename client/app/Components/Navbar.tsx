"use client";
import { Box, Button, Flex, Heading } from "@radix-ui/themes";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";

const Navbar = () => {
  const { data, status } = useSession();

  return (
    <div className="w-full flex items-center py-4 lg:px-4  px-8 justify-between border-b-2 border-gray-400">
      <Link href="/">
        <Heading size="8"> Radiation </Heading>
      </Link>

      {status != "authenticated" ? (
        <Box>
          <Link href={"/signin"}>
            <Button variant="outline" color="gold">
              Login
            </Button>
          </Link>
          <Link href={"/signup"} className="ml-4">
            <Button variant="outline" color="teal">
              Signup
            </Button>
          </Link>
        </Box>
      ) : (
        <Flex align="center" gap="4">
          {" "}
          <Heading
            size="5"
            color="gold"
            className="italic inline-block items-center"
          >
            {data.user?.email} &nbsp;
          </Heading>
          <Button
            className="block"
            onClick={() => signOut()}
            variant="classic"
            color="red"
          >
            Logout
          </Button>
        </Flex>
      )}
    </div>
  );
};

export default Navbar;
