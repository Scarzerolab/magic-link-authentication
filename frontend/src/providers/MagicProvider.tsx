'use client';

import { Magic as MagicBase } from "magic-sdk";
import { OAuthExtension } from "@magic-ext/oauth2";
import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from "react";

export type Magic = MagicBase<OAuthExtension[]>

type MagicContextType = {
    magic: Magic | null;
}

const MagicContext = createContext<MagicContextType>({
    magic: null
})

export const useMagic = () => useContext(MagicContext);

const MagicProvider = ({ children }: { children: ReactNode }) => {
  const [magic, setMagic] = useState<Magic | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MAGIC_API_KEY) {
      const magic = new MagicBase(process.env.NEXT_PUBLIC_MAGIC_API_KEY as string, {
        network: {
          rpcUrl: "https://rpc.ankr.com/xdc_testnet",
          chainId: 51,
        },
        extensions: [new OAuthExtension()]
      });

      setMagic(magic);
    }
  }, []);

  const value = useMemo(() => {
    return {
      magic,
    };
  }, [magic]);

  return <MagicContext.Provider value={value}>{children}</MagicContext.Provider>;
};

export default MagicProvider;