import * as dotenv from "dotenv";

import { task } from "hardhat/config";

dotenv.config();

export default task("preset", "presets")
  .setAction(async (_, hre) => {
    hre.changeNetwork("bsc");
    let [signer] = await hre.ethers.getSigners();

    const bridgeBEP = await hre.ethers.getContractAt("Bridge", process.env.BEP_BRIDGE as string, signer);
    await bridgeBEP.setOtherSeparator(4, process.env.ERC_BRIDGE as string).then((result: any) => console.log(result.hash));
    await bridgeBEP.createPair(process.env.ERC20 as string, process.env.BEP20 as string).then((result: any) => console.log(result.hash));

    hre.changeNetwork("rinkeby");
    [signer] = await hre.ethers.getSigners();

    const bridgeERC = await hre.ethers.getContractAt("Bridge", process.env.ERC_BRIDGE as string, signer);
    await bridgeERC.setOtherSeparator(97, process.env.BEP_BRIDGE as string).then((result: any) => console.log(result.hash));
    await bridgeERC.createPair(process.env.BEP20 as string, process.env.ERC20 as string).then((result: any) => console.log(result.hash));
});