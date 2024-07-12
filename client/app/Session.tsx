"use client";
import { useSession } from "next-auth/react";
import React from "react";

const Session = () => {
  const { data, status, update } = useSession({ required: true });

  return (
    <div>
      <button
        className="my-6"
        onClick={() => {
          update({
            time: "now",
          });
        }}
      >
        Update
      </button>
      <div>Session : {JSON.stringify({ data, status }, null, 4)}</div>
    </div>
  );
};

export default Session;
