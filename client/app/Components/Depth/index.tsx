import { SignallingManager } from "@/app/lib/SignallingManager";
import React, { useEffect } from "react";

const DepthTab = ({ market }: { market: string }) => {
  useEffect(() => {
    console.log("cnsdjkcnsdjkcnksjdnk");
    SignallingManager.getInstance().sendMessage({
      method: "SUBSCRIBE",
      params: [`depth@${market}`],
    });
    return () => {
      SignallingManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`depth@${market}`.toLowerCase()],
      });
    };
  }, [market]);
  return <div>DepthTab</div>;
};

export default DepthTab;
