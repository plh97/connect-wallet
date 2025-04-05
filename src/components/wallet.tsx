import { useState } from "react";
import { useMetaMask } from "./hooks";

export function Wallet() {
    const {
        connectMetaMask,
        connectCoinbaseWallet,
        refreshBalance,
        connectWalletConnect,
        transferWeth,
        address,
        ethBalance,
        wethBalance,
        txStatus,
        switchNetwork,
    } = useMetaMask();
    const [transferAmount, setTransferAmount] = useState("0.0000001");
    const [receiverAddress, setReceiverAddress] = useState(
        "0x22404D10D904e9965bAF6682418C18dF22E31298"
    );

    return (
        <main
            style={{
                border: "2px solid #fff",
                borderRadius: "10px",
                padding: "10px",
                margin: "10px",
                height: 500,
                width: 500,
            }}
        >
            {address ? (
                <>
                    <button>已经连接钱包</button>
                    <button onClick={refreshBalance}>
                        刷新余额
                    </button>
                    <button onClick={switchNetwork}>
                        switchNetwork
                    </button>
                </>
            ) : (
                <>
                    <button onClick={connectMetaMask}>连接 Wallet</button>
                    <button onClick={connectCoinbaseWallet}>连接 Coinbase Wallet</button>
                    <button onClick={connectWalletConnect}>连接 Wallet Connect</button>
                </>
            )}
            {address && (
                <div className="account-info">
                    <h3>账户地址: {address}</h3>
                    <h3>ETH 余额: {ethBalance || "加载中..."}</h3>
                    <h3>WETH 余额: {wethBalance || "加载中..."}</h3>

                    <h3>
                        转账 WETH 金额:
                        <input
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            placeholder="WETH 金额"
                        />
                    </h3>
                    <h3>
                        接收地址:
                        <input
                            value={receiverAddress}
                            onChange={(e) => setReceiverAddress(e.target.value)}
                            placeholder="接收地址"
                        />
                    </h3>
                    <button onClick={() => transferWeth(transferAmount, receiverAddress)}>
                        发送 WETH
                    </button>
                    {txStatus && <p>{txStatus}</p>}
                </div>
            )}
        </main>
    );
}