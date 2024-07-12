import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  TextField,
} from "@radix-ui/themes";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

const AuthForm = ({
  label,
  onSubmit,
  error: err,
}: {
  label: string;
  error: string;
  onSubmit: (email: string, password: string) => Promise<void>;
}) => {
  const [formData, setFormData] = useState({
    email: "1@2.3",
    password: "123",
  });

  const [error, setError] = useState(err);

  useEffect(() => {
    setError(err);
  }, [err]);

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const tgt = e.target;
    if (error) setError("");
    setFormData((p) => ({ ...p, [tgt.name]: tgt.value }));
  };

  return (
    <div className="w-[calc(100vw-60px)] sm:max-w-[550px] sm:min-w-[500px] px-8 py-12  rounded-md border-2 border-gray-600 ">
      <form
        className="flex flex-col"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await onSubmit(formData.email, formData.password);
          } catch (error) {
          } finally {
            setIsLoading(false);
          }
        }}
      >
        <Heading mb="4" size="8" align="center">
          {label}
        </Heading>

        <Text
          className="items-start mb-2 italic "
          color="red"
          align="center"
          size="4"
        >
          {error}
        </Text>

        <Text className="items-start mb-2" size="6">
          Email
        </Text>
        <TextField.Root
          required={true}
          size="3"
          placeholder="Email"
          value={formData.email}
          className="w-full"
          name="email"
          onChange={handleChange}
        />
        <Text className="items-start mb-2 mt-4" size="6">
          Password
        </Text>
        <TextField.Root
          required={true}
          size="3"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full mb-4"
        />
        <Button radius="full" size="3" disabled={isLoading} type="submit">
          Submit
        </Button>
      </form>
      <div className="flex justify-center items-center py-2">
        {label != "Signin" ? (
          <>
            Have account!
            <Link className="ml-2 underline text-blue-500 " href="/signin">
              Login
            </Link>
          </>
        ) : (
          <>
            New to portal!
            <Link className="ml-2 underline text-blue-500" href="/signup">
              Signup
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
