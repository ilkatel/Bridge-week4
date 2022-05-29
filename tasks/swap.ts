import * as dotenv from "dotenv";
import { utils } from "./utils";
import { task } from "hardhat/config";

dotenv.config();

const u = new utils;

export default task("swap", "deploy bringe in bsc")
    .addParam("chain", "chain name")
    .addParam("amount", "tx hash")
    .setAction(async (taskArgs, hre) => {
        if (taskArgs.chain == "BEP") hre.changeNetwork("bsc");
        else hre.changeNetwork("rinkeby");
        
        const bridge = await u.Bridge(taskArgs.chain, hre);
        const token = u.Token(taskArgs.chain, hre);
        await bridge.swap(token as string, taskArgs.amount)
            .then((result: any) => console.log(result.hash));
});