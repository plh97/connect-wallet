import { BrowserProvider, ethers } from "ethers";
import { useRef, useState } from "react";
import { createCoinbaseWalletSDK } from "@coinbase/wallet-sdk";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

// 项目公共变量
const PROJECT_NAME = "wallet connection test";
const SEPOLIA_CHAIN_ID = "11155111";
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // Sepolia WETH
const WETH_ABI = [
    "function transfer(address to, uint256 amount) public returns (bool)",
    "function balanceOf(address account) public view returns (uint256)",
    "function decimals() public view returns (uint8)",
];

export const useMetaMask = () => {
    const [address, setAddress] = useState("");
    const [ethBalance, setEthBalance] = useState("");
    const [wethBalance, setWethBalance] = useState("");
    const [txStatus, setTxStatus] = useState("");
    const signerRef = useRef<ethers.JsonRpcSigner | null>(null);
    const providerRef = useRef<BrowserProvider | ethers.Provider | null>(null);

    // 确保连接到 Sepolia 测试网
    const ensureSepoliaNetwork = async (provider: BrowserProvider) => {
        try {
            const network = await provider.getNetwork();
            const currentChainId = network.chainId.toString();
            console.log("Current chainId:", currentChainId);

            if (currentChainId !== SEPOLIA_CHAIN_ID) {
                console.log("Switching to Sepolia...");
                await provider.send("wallet_switchEthereumChain", [
                    { chainId: `0x${parseInt(SEPOLIA_CHAIN_ID).toString(16)}` },
                ]);
                console.log("Switched to Sepolia");

                // 等待网络切换完成
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        } catch (switchError: any) {
            if (switchError.code === 4902) {
                console.log("Adding Sepolia network...");
                await provider.send("wallet_addEthereumChain", [
                    {
                        chainId: `0x${parseInt(SEPOLIA_CHAIN_ID).toString(16)}`,
                        chainName: "Sepolia Test Network",
                        rpcUrls: ["https://rpc.sepolia.org"],
                        nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
                        blockExplorerUrls: ["https://sepolia.etherscan.io"],
                    },
                ]);
                console.log("Sepolia network added");

                // 等待网络添加完成
                await new Promise((resolve) => setTimeout(resolve, 1000));
            } else {
                console.error("Network switch failed:", switchError);
                throw new Error("请切换到 Sepolia 测试网！");
            }
        }
    };

    // MetaMask 连接
    const connectMetaMask = async () => {
        if (!window.ethereum) throw new Error("请安装 MetaMask！");
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        await ensureSepoliaNetwork(provider);

        const signer = await provider.getSigner();
        const addr = await signer.getAddress();
        setAddress(addr);
        setEthBalance(ethers.formatEther(await provider.getBalance(addr)));

        const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, provider);
        let decimals = 18;
        try {
            decimals = await wethContract.decimals();
        } catch (error) {
            console.error("获取 WETH decimals 失败，使用默认值 18:", error);
        }
        const balance = await wethContract.balanceOf(addr);
        setWethBalance(ethers.formatUnits(balance, decimals));

        signerRef.current = signer;
        providerRef.current = provider;
    };

    // Coinbase Wallet 连接
    const connectCoinbaseWallet = async () => {
        try {
            setTxStatus("正在连接 Coinbase Wallet...");
            const coinbaseWallet = createCoinbaseWalletSDK({
                appName: PROJECT_NAME,
                appLogoUrl: "https://example.com/logo.png",
            });

            const provider = coinbaseWallet.getProvider();
            const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
            const addr = accounts[0];
            console.log("Coinbase Wallet address:", addr);

            const ethersProvider = new ethers.BrowserProvider(provider);
            await ensureSepoliaNetwork(ethersProvider);

            // 确保网络切换完成后，provider 状态稳定
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const signer = await ethersProvider.getSigner();

            setAddress(addr);
            setTxStatus("正在获取余额...");
            const newBalance = await ethersProvider.getBalance(addr);
            setEthBalance(ethers.formatEther(newBalance));

            const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, ethersProvider);
            let decimals = 18;
            try {
                decimals = await wethContract.decimals();
                console.log("WETH decimals:", decimals);
            } catch (error) {
                console.error("获取 WETH decimals 失败，使用默认值 18:", error);
            }
            const balance = await wethContract.balanceOf(addr);
            setWethBalance(ethers.formatUnits(balance, decimals));

            signerRef.current = signer;
            providerRef.current = ethersProvider;
            setTxStatus("连接成功！");
        } catch (error: any) {
            console.error("Coinbase Wallet 连接失败:", error);
            setTxStatus(`连接失败: ${error.message}`);
            throw new Error(`Coinbase Wallet 连接失败: ${error.message}`);
        }
    };

    // WalletConnect 连接
    const connectWalletConnect = async () => {
        try {
            setTxStatus("正在初始化 WalletConnect...");
            const provider = await EthereumProvider.init({
                projectId: "7e4a8847f85f0587eb5dee790394cac2",
                chains: [parseInt(SEPOLIA_CHAIN_ID)],
                optionalChains: [1, parseInt(SEPOLIA_CHAIN_ID)],
                rpcMap: {
                    [SEPOLIA_CHAIN_ID]: "https://sepolia.infura.io/v3/3311245dce034f8ab2767343e96a65b3",
                    "1": "https://chain-proxy.wallet.coinbase.com?targetName=ethereum-mainnet",
                },
                showQrModal: true,
                metadata: {
                    name: PROJECT_NAME,
                    description: "A demo dApp using WalletConnect",
                    url: location.origin,
                    icons: [],
                },
            });

            console.log("WalletConnect provider initialized");

            setTxStatus("请扫描二维码以连接钱包...");
            await provider.connect();
            setTxStatus("WalletConnect 连接成功，等待账户授权...");

            const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
            const addr = accounts[0];
            console.log("Address retrieved:", addr);

            const ethersProvider = new ethers.BrowserProvider(provider);
            await ensureSepoliaNetwork(ethersProvider);

            const signer = await ethersProvider.getSigner();

            setAddress(addr);
            setTxStatus("正在获取余额...");
            const newBalance = await ethersProvider.getBalance(addr);
            setEthBalance(ethers.formatEther(newBalance));

            const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, ethersProvider);
            let decimals = 18;
            try {
                decimals = await wethContract.decimals();
                console.log("WETH decimals:", decimals);
            } catch (error) {
                console.error("获取 WETH decimals 失败，使用默认值 18:", error);
            }
            const balance = await wethContract.balanceOf(addr);
            setWethBalance(ethers.formatUnits(balance, decimals));

            signerRef.current = signer;
            providerRef.current = ethersProvider;
            setTxStatus("连接成功！");

            provider.on("disconnect", () => {
                setAddress("");
                setEthBalance("");
                setWethBalance("");
                setTxStatus("Wallet disconnected");
                signerRef.current = null;
                providerRef.current = null;
            });
        } catch (error: any) {
            console.error("WalletConnect 连接失败:", error);
            setTxStatus(`连接失败: ${error.message}`);
            throw new Error(`WalletConnect 连接失败: ${error.message}`);
        }
    };

    // 刷新余额
    const refreshBalance = async () => {
        try {
            const provider = providerRef.current;
            const addr = address;

            if (!provider || !addr) {
                throw new Error("请先连接钱包！");
            }

            setTxStatus("正在刷新余额...");
            const ethBalanceRaw = await provider.getBalance(addr);
            setEthBalance(ethers.formatEther(ethBalanceRaw));

            const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, provider);
            let decimals = 18;
            try {
                decimals = await wethContract.decimals();
            } catch (error) {
                console.error("获取 WETH decimals 失败，使用默认值 18:", error);
            }
            const wethBalanceRaw = await wethContract.balanceOf(addr);
            setWethBalance(ethers.formatUnits(wethBalanceRaw, decimals));

            setTxStatus("余额已刷新");
        } catch (error: any) {
            console.error("刷新余额失败:", error);
            setTxStatus(`刷新余额失败: ${error.message}`);
        }
    };

    // 转账 WETH
    const transferWeth = async (amount: string, recipientAddress: string) => {
        try {
            setTxStatus("交易处理中...");
            const signer = signerRef.current;
            if (!signer) throw new Error("请先连接钱包！");

            const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, signer);
            let decimals = 18;
            try {
                decimals = await wethContract.decimals();
            } catch (error) {
                console.error("获取 WETH decimals 失败，使用默认值 18:", error);
            }
            const balance = await wethContract.balanceOf(await signer.getAddress());
            const amountInUnits = ethers.parseUnits(amount, decimals);

            if (balance < amountInUnits) {
                throw new Error("WETH 余额不足！");
            }

            const tx = await wethContract.transfer(recipientAddress, amountInUnits);
            const receipt = await tx.wait();
            setTxStatus(`转账成功！交易哈希: ${receipt.hash}`);

            const updatedBalance = await wethContract.balanceOf(await signer.getAddress());
            setWethBalance(ethers.formatUnits(updatedBalance, decimals));
        } catch (error: any) {
            console.error("转账失败:", error);
            setTxStatus(`转账失败: ${error.message}`);
        }
    };

    return {
        connectMetaMask,
        connectCoinbaseWallet,
        connectWalletConnect,
        transferWeth,
        refreshBalance,
        address,
        ethBalance,
        wethBalance,
        txStatus,
    };
};