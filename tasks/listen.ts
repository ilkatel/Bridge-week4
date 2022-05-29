import { utils } from "./utils";
import { task } from "hardhat/config";
import { BigNumber } from "ethers";

const u = new utils;

export default task("listen", "redeem")
    .addParam("chain", "chain name")
    .setAction(async (taskArgs, hre) => {
        if (taskArgs.chain == "BEP") hre.changeNetwork("bsc");
        else hre.changeNetwork("rinkeby");
        
        const bridge = await u.Bridge(taskArgs.chain, hre);
        hre.ethers.provider.pollingInterval = 4000;
        
        const [signer] = await hre.ethers.getSigners();

        console.log("start listening");
        await new Promise(async (resolve, reject) => {
            bridge.on("SwapInitialized", async (
                hash: string, swapToken: string, receiveToken: string, to: string, amount: BigNumber, nonce: BigNumber
            ) => {
                try {
                    const signature = await hre.web3.eth.sign(hash, signer.address);
                    await hre.run("redeem", {
                        chain: taskArgs.chain == "BEP" ? "ERC" : "BEP",
                        hash: hash,
                        token: receiveToken,
                        to: to,
                        amount: amount.toString(),
                        nonce: nonce.toString(),
                        signature: signature
                    });
                } catch(e: any) { reject(e) }
            })
        });
});