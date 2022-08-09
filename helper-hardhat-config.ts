export interface networkConfigItem {
    name?: string
    blockConfirmations?: number
}

export interface networkConfigInfo {
    [key: number]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
    31337: {
        name: "localhost",
    },
    4: {
        name: "rinkeby",
        blockConfirmations: 6,
    },
    1: {
        name: "mainnet",
        blockConfirmations: 6,
    },
}

export const developmentChains = ["hardhat", "localhost"]
