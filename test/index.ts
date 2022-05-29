import { expect } from "chai";
import { ethers, web3 } from "hardhat";
import { Contract, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Bridge__factory, ERCTOKEN__factory, } from "../typechain";

let signer: SignerWithAddress;
let accBEP: SignerWithAddress;
let accERC: SignerWithAddress;
let bridgeERC: Contract;
let bridgeBEP: Contract;
let erc20: Contract;
let bep20: Contract;
const zeroAddress = ethers.constants.AddressZero;

const chainId: number = 31337;

describe("Test", function () {
  beforeEach(async function () {
    ethers.provider.pollingInterval = 100;
    [signer, accBEP, accERC] = await ethers.getSigners();

    erc20 = await new ERCTOKEN__factory(signer).deploy("ERC20 token", "E20");
    await erc20.deployed();
    bep20 = await new ERCTOKEN__factory(signer).deploy("BEP20 token", "B20");
    await bep20.deployed();

    bridgeERC = await new Bridge__factory(signer).deploy();
    await bridgeERC.deployed(); 
    bridgeBEP = await new Bridge__factory(signer).deploy();
    await bridgeBEP.deployed();

    await bridgeERC.setOtherSeparator(chainId, bridgeBEP.address)
    await bridgeBEP.setOtherSeparator(chainId, bridgeERC.address)
    await bridgeERC.createPair(bep20.address, erc20.address);
    await bridgeBEP.createPair(erc20.address, bep20.address);

    await erc20.changeRightsToMint(bridgeBEP.address);
    await erc20.changeRightsToMint(bridgeERC.address);
    await bep20.changeRightsToMint(bridgeBEP.address);
    await bep20.changeRightsToMint(bridgeERC.address);

    await erc20.mint(accERC.address, ethers.utils.parseEther("10"));
    await bep20.mint(accBEP.address, ethers.utils.parseEther("10"));

  });

  it("Bae errors check", async function () {
    // create pair
    await expect(bridgeERC.connect(accBEP).createPair(bep20.address, erc20.address)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(bridgeERC.createPair(bep20.address, erc20.address)).to.be.revertedWith("Pair existent!");

    // set other separator
    await expect(bridgeERC.connect(accBEP).setOtherSeparator(chainId, bridgeBEP.address)).to.be.revertedWith("Ownable: caller is not the owner");
  });
  
  it("Transactions errors check", async function () {
    await expect(bridgeERC.swap(zeroAddress, 100)).to.be.revertedWith("Incorrect token address!");
    await expect(bridgeERC.transfer(bep20.address, zeroAddress, 100)).to.be.revertedWith("Cant transfer to zero address!");
    await expect(bridgeERC.transfer(accBEP.address, accBEP.address, 100)).to.be.revertedWith("Bridge non-existent!");
    await expect(bridgeERC.transfer(bep20.address, accBEP.address, 0)).to.be.revertedWith("Amount cant be null!");
  });

  it("Redeem errors check", async function () {
    await new Promise(async (resolve, reject) => {
      bridgeERC.once("SwapInitialized", async (
        hash: string, swapToken: string, receiveToken: string, to: string, amount: BigNumber, nonce: BigNumber
      ) => {
        let signature = await web3.eth.sign(hash, accERC.address);
        await expect(bridgeBEP.redeem(hash, receiveToken, to, amount, nonce, signature)).to.be.revertedWith("Transaction not signed from admin!");
        await expect(bridgeBEP.redeem(hash, receiveToken, to, amount, nonce, "0x91")).to.be.revertedWith("Invalid signature!");
        await expect(bridgeBEP.redeem(hash, receiveToken, to, amount, 11, signature)).to.be.revertedWith("Incorrect transaction!");

        signature = await web3.eth.sign(hash, signer.address);
        await expect(() => bridgeBEP.redeem(hash, receiveToken, to, amount, nonce, signature)).changeTokenBalance(bep20, accERC, 100);
        
        await expect(bridgeBEP.redeem(hash, receiveToken, to, amount, nonce, signature)).to.be.revertedWith("Completed transaction!");
        resolve("");
      })
      await expect(() => bridgeERC.connect(accERC).swap(bep20.address, 100)).changeTokenBalance(erc20, accERC, -100);
    });

  });

  it("Swap test ERC20 -> BEP20", async function () {
    await new Promise(async (resolve, reject) => {
      bridgeERC.once("SwapInitialized", async (
        hash: string, swapToken: string, receiveToken: string, to: string, amount: BigNumber, nonce: BigNumber
      ) => {
        const signature = await web3.eth.sign(hash, signer.address);
        await expect(() => bridgeBEP.redeem(hash, receiveToken, to, amount, nonce, signature)).changeTokenBalance(bep20, accERC, 100);
        resolve("");
      })
      await expect(() => bridgeERC.connect(accERC).swap(bep20.address, 100)).changeTokenBalance(erc20, accERC, -100);
    });
  });

  it("Swap test BEP20 -> ERC20", async function () {
    await new Promise(async (resolve, reject) => {
      bridgeBEP.once("SwapInitialized", async (
        hash: string, swapToken: string, receiveToken: string, to: string, amount: BigNumber, nonce: BigNumber
      ) => {
        const signature = await web3.eth.sign(hash, signer.address);
        await expect(() => bridgeERC.redeem(hash, receiveToken, to, amount, nonce, signature)).changeTokenBalance(erc20, accBEP, 100);
        resolve("");
      })
      await expect(() => bridgeBEP.connect(accBEP).swap(erc20.address, 100)).changeTokenBalance(bep20, accBEP, -100);
    });
  });

  it("Transfer ERC -> BEP", async function () {
    await new Promise(async (resolve, reject) => {
      bridgeERC.once("SwapInitialized", async (
        hash: string, swapToken: string, receiveToken: string, to: string, amount: BigNumber, nonce: BigNumber
      ) => {
        const signature = await web3.eth.sign(hash, signer.address);
        await expect(() => bridgeBEP.redeem(hash, receiveToken, to, amount, nonce, signature)).changeTokenBalance(bep20, accBEP, 100);
        resolve("");
      })
      await expect(() => bridgeERC.connect(accERC).transfer(bep20.address, accBEP.address, 100)).changeTokenBalance(erc20, accERC, -100);
    });
  });

  it("Transfer BEP -> ERC", async function () {
    await new Promise(async (resolve, reject) => {
      bridgeBEP.once("SwapInitialized", async (
        hash: string, swapToken: string, receiveToken: string, to: string, amount: BigNumber, nonce: BigNumber
      ) => {
        const signature = await web3.eth.sign(hash, signer.address);
        await expect(() => bridgeERC.redeem(hash, receiveToken, to, amount, nonce, signature)).changeTokenBalance(erc20, accERC, 100);
        resolve("");
      })
      await expect(() => bridgeBEP.connect(accBEP).transfer(erc20.address, accERC.address, 100)).changeTokenBalance(bep20, accBEP, -100);
    });
  });
});
