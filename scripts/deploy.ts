import { run } from "hardhat";

async function deploy() {
  await run("deploy", {
    chain: "BEP"
  });
  await run("deploy", {
    chain: "ERC"
  });
}

deploy().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
