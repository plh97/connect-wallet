interface Window {
    ethereum?: {
        // MetaMask 注入的常用方法
        request: (args: { method: string; params?: any[] }) => Promise<any>;
        send: (method: string, params?: any[]) => Promise<any>;
        on: (eventName: string, callback: (...args: any[]) => void) => void;
        removeListener: (eventName: string, callback: (...args: any[]) => void) => void;
        isMetaMask?: boolean;
        [key: string]: any; // 允许其他动态属性
    };
}