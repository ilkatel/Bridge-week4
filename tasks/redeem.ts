import * as dotenv from "dotenv";
import { utils } from "./utils";
import { task } from "hardhat/config";

dotenv.config();

const u = new utils;

export default task("redeem", "redeem")
    .addParam("chain", "chain name")
    .addParam("hash", "tx hash")
    .addParam("token", "token")
    .addParam("to", "to")
    .addParam("amount", "amount")
    .addParam("nonce", "nonce")
    .addParam("signature", "signature")
    .setAction(async (taskArgs, hre) => {
        if (taskArgs.chain == "BEP") hre.changeNetwork("bsc");
        else hre.changeNetwork("rinkeby");
        
        const bridge= await u.Bridge(taskArgs.chain, hre);
        await bridge.redeem(taskArgs.hash, taskArgs.token, taskArgs.to, taskArgs.amount, taskArgs.nonce, taskArgs.signature)
            .then((result: any) => console.log(result.hash));
});