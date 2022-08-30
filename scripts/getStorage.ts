import { ethers } from "hardhat"
import { getUint256, getShortStr, getLongStr } from "../utils/solidityStorageUtils"

async function main() {
    const slot = ethers.utils.hexValue(0)
    const address = "0x726714e8457aCbD729805223616Ec5A6D8C7193A"
    const paddedSlot = ethers.utils.hexZeroPad(slot, 32)
    const storageLocation = await ethers.provider.getStorageAt(address, paddedSlot)
    console.log(storageLocation.toString())
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
