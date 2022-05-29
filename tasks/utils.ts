import * as dotenv from "dotenv";

dotenv.config();

class utils {
    
    async Bridge(name: string, hre: any) {
        const [signer] = await hre.ethers.getSigners();
        if (name == "BEP")
            return await hre.ethers.getContractAt("Bridge", process.env.BEP_BRIDGE as string, signer);
        else
            return await hre.ethers.getContractAt("Bridge", process.env.ERC_BRIDGE as string, signer);
    }   

    Token(name: string, hre: any) {
        return name == "BEP" ? process.env.ERC20 as string : process.env.BEP20 as string;
    }
}

export { utils }