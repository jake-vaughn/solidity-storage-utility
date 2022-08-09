import { getNamedAccounts, network, deployments, ethers } from "hardhat"
import { expect } from "chai"
import { developmentChains } from "../../helper-hardhat-config"
import { StorageContract } from "../../typechain-types"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import {
    getArrayItem,
    getBytePackedVar,
    getLongStr,
    getMappingItem,
    getMappingStruct,
    getNestedMappingStruct,
    getShortStr,
    getUint256,
} from "../../utils/solidityStorageUtils"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("StorageContract", function () {
          let storageContract: StorageContract
          let deployer: string
          let storageContractAddr: string
          let accounts: SignerWithAddress[]
          let users: string[]
          let propDesc: string[]

          before(async () => {
              // deployer = accounts[0]
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              storageContract = await ethers.getContract("StorageContract", deployer)
              storageContractAddr = storageContract.address
              // get accounts
              accounts = await ethers.getSigners()

              // populate userBalance mapping
              users = []
              for (let account of accounts) {
                  users.push(account.address)
              }
              await storageContract.populateUserBalances(users)

              propDesc = ["Prop desc 1", "Prop desc 2", "Prop desc 3"]
          })

          describe("populateUserBalances", function () {
              it("Check test account balance", async function () {
                  expect(
                      ethers.utils.formatEther(await ethers.provider.getBalance(users[3]))
                  ).to.equal("10000.0")
              })
          })

          describe("uint256 storage", function () {
              it("Read uint256", async function () {
                  expect(await getUint256("0x4", storageContractAddr)).to.equal(99)
                  expect(await getUint256("0x9", storageContractAddr)).to.equal(users[0])
                  expect(await getUint256("0xa", storageContractAddr)).to.equal(1)
              })
          })

          describe("string storage", function () {
              it("Read short string", async function () {
                  expect(await getShortStr("0x2", storageContractAddr)).to.equal("hello world")
              })

              it("Read long string", async function () {
                  expect(await getLongStr("0x3", storageContractAddr)).to.equal(
                      "this string is 92 bytes long so it will use three 32 byte storage slots totaling 96 bytes"
                  )
              })
          })

          describe("bytes storage", function () {
              it("Read byte-packed slot: <= 6-byte", async function () {
                  expect(await getBytePackedVar("0x0", storageContractAddr, 0, 2)).to.equal("ace0")
                  expect(await getBytePackedVar("0x0", storageContractAddr, 4, 4)).to.equal(
                      "bebeace0"
                  )
                  expect(await getBytePackedVar("0x0", storageContractAddr, 12, 4)).to.equal(
                      "cafebebe"
                  )
                  expect(await getBytePackedVar("0x0", storageContractAddr, 20, 6)).to.equal(
                      "debecafebebe"
                  )
              })

              it("Read byte-packed slot: 8-byte", async function () {
                  expect(await getBytePackedVar("0x0", storageContractAddr, 32, 8)).to.equal(
                      "ebeedebecafebebe"
                  )
                  expect(await getBytePackedVar("0x0", storageContractAddr, 48, 8)).to.equal(
                      "febeeacecafebebe"
                  )
              })

              it("Read byte-packed slot: 16-byte", async function () {
                  expect(await getBytePackedVar("0x1", storageContractAddr, 0, 16)).to.equal(
                      "aace00bebe00cafe00ace09876543210"
                  )
                  expect(await getBytePackedVar("0x1", storageContractAddr, 32, 16)).to.equal(
                      "bbebe0febee00ace00cafe0123456789"
                  )
              })
          })

          describe("bytes[] storage", function () {
              it("Read byte-packed array: 8-byte slots", async function () {
                  const answers = [
                      "ace00",
                      "bebeace000000000",
                      "cafebebe00000000",
                      "debecafebebe0000",
                      "ebeedebecafebebe",
                      "febeeacecafebebe",
                  ]
                  for (let i = 0; i < answers.length; i++) {
                      expect(await getArrayItem("0x5", storageContractAddr, i, 8)).to.equal(
                          answers[i]
                      )
                  }
              })

              it("Read byte-packed array: 16-byte slots", async function () {
                  const answers = [
                      "ace0000000",
                      "bebeace000",
                      "cafebebe00",
                      "debecafebebe000000000",
                      "ebeedebecafebebe00000",
                      "febeeacecafebebe00000",
                      "aace00bebe00cafe00ace09876543210",
                      "bbebe0febee00ace00cafe0123456789",
                  ]
                  for (let i = 0; i < answers.length; i++) {
                      expect(await getArrayItem("0x6", storageContractAddr, i, 16)).to.equal(
                          answers[i]
                      )
                  }
              })
          })

          describe("mapping storage", function () {
              it("Read balance from userBalances mapping", async function () {
                  expect(await getMappingItem("0x7", storageContractAddr, users[0])).to.equal(5)
                  expect(await getMappingItem("0x7", storageContractAddr, users[1])).to.equal(10)
                  expect(await getMappingItem("0x7", storageContractAddr, users[2])).to.equal(15)
                  expect(await getMappingItem("0x7", storageContractAddr, users[3])).to.equal(20)
              })
          })

          // TODO:
          describe("createProposal", function () {})

          // TODO:
          describe("voteOnProposal", function () {})

          describe("mapping struct storage ", function () {
              before(async function () {
                  // create proposals 1, 2, 3
                  await storageContract.createProposal(propDesc[0])
                  await storageContract.connect(accounts[1]).createProposal(propDesc[1])
                  await storageContract.connect(accounts[5]).createProposal(propDesc[2])
                  // vote on proposal 1
                  await storageContract.connect(accounts[1]).voteOnProposal(1, true)
                  await storageContract.connect(accounts[2]).voteOnProposal(1, false)
                  await storageContract.connect(accounts[5]).voteOnProposal(1, true)
                  // vote on proposal 2
                  await storageContract.voteOnProposal(2, true)
                  await storageContract.connect(accounts[1]).voteOnProposal(2, false)
                  await storageContract.connect(accounts[2]).voteOnProposal(2, true)
                  // vote on proposal 2
                  await storageContract.voteOnProposal(3, false)
                  await storageContract.connect(accounts[5]).voteOnProposal(3, false)
                  await storageContract.connect(accounts[2]).voteOnProposal(3, false)
              })
              it("Read mapping to struct: proposer", async function () {
                  expect(
                      await getMappingStruct("0x8", storageContractAddr, "0x1", 0, "bytes")
                  ).to.equal(`00${users[0].slice(2)}`.toLowerCase())
                  expect(
                      await getMappingStruct("0x8", storageContractAddr, "0x3", 0, "bytes")
                  ).to.equal(`00${users[5].slice(2)}`.toLowerCase())
              })

              it("Read mapping to struct: description", async function () {
                  expect(
                      await getMappingStruct("0x8", storageContractAddr, "0x1", 1, "string")
                  ).to.equal("Prop desc 1")
                  expect(
                      await getMappingStruct("0x8", storageContractAddr, "0x3", 1, "string")
                  ).to.equal("Prop desc 3")
              })

              it("Read mapping to struct: yes / no votes", async function () {
                  expect(
                      await getMappingStruct("0x8", storageContractAddr, "0x1", 2, "number")
                  ).to.equal("2") //Yes's
                  expect(
                      await getMappingStruct("0x8", storageContractAddr, "0x1", 3, "number")
                  ).to.equal("1") // No's

                  expect(
                      await getMappingStruct("0x8", storageContractAddr, "0x2", 2, "number")
                  ).to.equal("2")
                  expect(
                      await getMappingStruct("0x8", storageContractAddr, "0x2", 3, "number")
                  ).to.equal("1")

                  expect(
                      await getMappingStruct("0x8", storageContractAddr, "0x3", 2, "number")
                  ).to.equal("0")
                  expect(
                      await getMappingStruct("0x8", storageContractAddr, "0x3", 3, "number")
                  ).to.equal("3")
              })

              it("Read mapping to struct: voteState [nested] mapping to enum", async function () {
                  expect(
                      await getNestedMappingStruct("0x8", storageContractAddr, "0x1", 4, users[0])
                  ).to.equal("0") // Absent
                  expect(
                      await getNestedMappingStruct("0x8", storageContractAddr, "0x1", 4, users[1])
                  ).to.equal("1") // Yes
                  expect(
                      await getNestedMappingStruct("0x8", storageContractAddr, "0x1", 4, users[2])
                  ).to.equal("2") // No

                  expect(
                      await getNestedMappingStruct("0x8", storageContractAddr, "0x2", 4, users[0])
                  ).to.equal("1") // Yes
                  expect(
                      await getNestedMappingStruct("0x8", storageContractAddr, "0x2", 4, users[1])
                  ).to.equal("2") // No
                  expect(
                      await getNestedMappingStruct("0x8", storageContractAddr, "0x2", 4, users[2])
                  ).to.equal("1") // Yes

                  expect(
                      await getNestedMappingStruct("0x8", storageContractAddr, "0x3", 4, users[0])
                  ).to.equal("2") // No
                  expect(
                      await getNestedMappingStruct("0x8", storageContractAddr, "0x3", 4, users[5])
                  ).to.equal("2") // No
                  expect(
                      await getNestedMappingStruct("0x8", storageContractAddr, "0x3", 4, users[2])
                  ).to.equal("2") // No
              })
          })
      })
