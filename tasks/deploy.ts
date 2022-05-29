import * as dotenv from "dotenv";

import { task } from "hardhat/config";
import { Bridge__factory, ERCTOKEN__factory, } from "../typechain";

dotenv.config();

export default task("deploy", "deploy bringe in bsc")
    .addParam("chain", "chain name")
    .setAction(async (taskArgs, hre) => {
        if (taskArgs.chain == "BEP") hre.changeNetwork("bsc");
        else hre.changeNetwork("rinkeby");
        console.log(hre.network);

        const [signer] = await hre.ethers.getSigners();

        const token = await new ERCTOKEN__factory(signer).deploy(`${taskArgs.chain}20 Crosschain Token`, `${taskArgs.chain}CT`);
        await token.deployed();
        console.log(`${taskArgs.chain}20 Token deployed with address ${token.address}`);

        const bridge = await new Bridge__factory(signer).deploy();
        await bridge.deployed();
        console.log(`${taskArgs.chain}20 Bridge deployed with address ${bridge.address}`);

        await token.changeRightsToMint(bridge.address);
        await token.mint(signer.address, hre.ethers.utils.parseEther("100"));
        
        // verify ------------------------------------------------------------------------------ //
        await hre.run("verify:verify", {
            address: token.address,
            constructorArguments: [`${taskArgs.chain}20 Crosschain Token`, `${taskArgs.chain}CT`],
        });

        await hre.run("verify:verify", {
            address: bridge.address,
            constructorArguments: [],
        });
});