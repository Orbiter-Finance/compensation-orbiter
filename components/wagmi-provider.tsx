"use client"

import * as React from "react"
import {
  RainbowKitProvider,
  connectorsForWallets,
  getDefaultWallets,
} from "@rainbow-me/rainbowkit"
import {
  argentWallet,
  ledgerWallet,
  trustWallet,
} from "@rainbow-me/rainbowkit/wallets"
import lodash from "lodash"
import { WagmiConfig, configureChains, createConfig } from "wagmi"
import * as wagmiChains from "wagmi/chains"
import { publicProvider } from "wagmi/providers/public"
import { siteConfig } from "@/config/site"

const { chains, publicClient, webSocketPublicClient } = configureChains(
  // @ts-ignore
  lodash.keys(wagmiChains).map((name) => wagmiChains[name]),
  [publicProvider()]
)

const projectId = ""

const { wallets } = getDefaultWallets({
  appName: siteConfig.name,
  projectId,
  chains,
})

const appInfo = {
  appName: siteConfig.name,
}

const connectors = connectorsForWallets([
  ...wallets,
  {
    groupName: "Other",
    wallets: [
      argentWallet({ projectId, chains }),
      trustWallet({ projectId, chains }),
      ledgerWallet({ projectId, chains }),
    ],
  },
])

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains} appInfo={appInfo}>
        {mounted && children}
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
