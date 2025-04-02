import { useRef, useState } from 'react';
import { ethers, BrowserProvider } from 'ethers'
import './App.css'

// ERC-20 ABI
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address account) public view returns (uint256)",
  "function decimals() public view returns (uint8)",
  "function totalSupply() public view returns (uint256)",
];

const useMetaMask = () => {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('');
  const signerRef = useRef<ethers.JsonRpcSigner>(null);
  const providerRef = useRef<BrowserProvider>(null);
  const connect = async () => {
    try {
      // 检查 MetaMask 是否已安装
      if (typeof window.ethereum === "undefined") {
        throw new Error("请安装 MetaMask！");
      }

      // 创建 Web3Provider，使用 window.ethereum
      const provider = new ethers.BrowserProvider(window.ethereum)
      providerRef.current = provider;

      // 请求用户授权连接账户
      await provider.send("eth_requestAccounts", []);

      // 获取签名者（signer），用于后续签名交易
      const signer = await provider.getSigner();
      signerRef.current = signer;

      // 获取连接的账户地址
      const address = await signer.getAddress();
      setAddress(address);

      // （可选）获取账户余额
      const balance = await provider.getBalance(address);
      setBalance(ethers.formatEther(balance));

      return { provider, signer };
    } catch (error) {
      console.error("连接 MetaMask 失败:", error);
      throw error;
    }
  }
  // 执行 ETH 转账的方法（通过 MetaMask 签名者）
  const transfer = async (amount: string, recipientAddress: string) => {
    try {
      const signer = signerRef.current;
      const provider = providerRef.current;

      if (!signer || !provider) {
        throw new Error('请先连接 MetaMask！');
      }

      // 1. 获取发送者的地址和余额
      const senderAddress = await signer.getAddress();
      const senderBalance = await provider.getBalance(senderAddress);
      console.log(`发送者地址: ${senderAddress}`);
      console.log(`发送者余额: ${ethers.formatEther(senderBalance)} ETH`);

      // 2. 将发送的 ETH 数量转换为 wei（最小单位）
      const amountInWei = ethers.parseEther(amount);
      console.log(`发送的 ETH 数量（wei）: ${amountInWei.toString()}`);

      // 3. 检查余额是否足够（包括 Gas 费用）
      if (senderBalance < amountInWei) {
        throw new Error('余额不足，无法发送 ETH');
      }

      // 4. 构造交易
      const tx = {
        to: recipientAddress,
        value: amountInWei,
        // 可选：手动设置 Gas 参数
        // gasLimit: 21000, // 标准 ETH 转账的 Gas 限制
        // gasPrice: await provider.getFeeData().then(fee => fee.gasPrice), // 获取当前 Gas 价格
      };

      // 5. 发送交易（通过 MetaMask 签名者）
      console.log(`发送 ${amount} ETH 到 ${recipientAddress}...`);
      const txResponse = await signer.sendTransaction(tx);
      console.log('交易已发送，等待确认...');

      // 6. 等待交易确认
      const receipt = await txResponse.wait();
      console.log('交易确认！');
      console.log('交易哈希:', receipt?.hash);

      // 7. 验证接收者的余额
      const receiverBalance = await provider.getBalance(recipientAddress);
      console.log(`接收者余额: ${ethers.formatEther(receiverBalance)} ETH`);

      // 8. 验证发送者的最新余额
      const updatedSenderBalance = await provider.getBalance(senderAddress);
      console.log(`发送者最新余额: ${ethers.formatEther(updatedSenderBalance)} ETH`);

      // 更新余额状态
      setBalance(ethers.formatEther(updatedSenderBalance));
    } catch (error: any) {
      console.error('发送 ETH 失败:', error.message);
      throw error;
    }
  };
  return {
    connect,
    transfer,
    address,
    balance,
  }
}

function App() {
  const { connect, address, balance, transfer } = useMetaMask();
  const [amount, setAmount] = useState('0.01');
  const [receiverAddress, setReceiverAddress] = useState('0xC5D319A1e6F6A19c426355152e9088bC7abe6f87');
  return (
    <main>
      <button onClick={connect}>MetaMask</button>
      {address && (
        <div className="account-info">
          <h3>已连接的账户地址: {address}</h3>
          <h3>账户余额: {balance} ETH</h3>
          <h3 className="input-group">
            <label htmlFor="amount">转账金额 (ETH): </label>
            <input
              id="amount"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="请输入转账金额"
              className="input-field"
            />
          </h3>
          <h3 className="input-group">
            <label htmlFor="receiverAddress">接收地址: </label>
            <input
              id="receiverAddress"
              type="text"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="请输入接收者地址"
              className="input-field"
            />
          </h3>
          <button onClick={() => transfer(amount, receiverAddress)}>transfer</button>
        </div>
      )}
    </main>
  )
}

export default App
