import { Suspense } from "react";
import Navbar from "../Components/Navbar";

const SingUpPageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-[calc(100vh-100px)] pt-32 grid place-content-center">
      <Suspense>{children}</Suspense>
    </div>
  );
};

export default SingUpPageLayout;
