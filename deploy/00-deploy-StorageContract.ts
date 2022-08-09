import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { networkConfig, developmentChains } from "../helper-hardhat-config"
import verify from "../utils/verify"

const deployStorageContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { network, deployments, getNamedAccounts, ethers } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("Deploying SmartContract and waiting for confirmations...")
    const storageContract = await deploy("StorageContract", {
        from: deployer,
        args: [],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.config.chainId!].blockConfirmations || 1,
    })
    log(`SmartContract deployed at ${storageContract.address}`)
    log("----------------------------------------------------")

    // Verify deploy on EtherScan
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        // verify
        log("Verifying contract...")
        await verify(storageContract.address, [])
        log("----------------------------------------------------")
    }
}

export default deployStorageContract
deployStorageContract.tags = ["all", "storage"]
