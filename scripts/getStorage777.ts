import { ethers } from "hardhat"
import { getUint256 } from "../utils/solidityStorageUtils"

async function main() {
    const storage777 = await getUint256(
        ethers.utils.hexValue(777),
        "0xb29ea9ad260b6dc980513bba29051570b2115110"
    )
    console.log(storage777.toString())
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
