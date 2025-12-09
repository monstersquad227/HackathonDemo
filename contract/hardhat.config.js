require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            },
            viaIR: true
        }
    },
    networks: {
        hardhat: {},
        localhost: {
            url: "http://127.0.0.1:8545"
        },
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL || (process.env.INFURA_API_KEY ? `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}` : "https://rpc.sepolia.org"),
            accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64 ? [process.env.PRIVATE_KEY] : [],
            chainId: 11155111,
        }
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY
    },
    sourcify: {
        enabled: true
    }
};

