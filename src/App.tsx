import { useState } from "react";
import { Wallet } from "./components/wallet";
import "./App.css";

function App() {
  const [arr, setArr] = useState([1]);
  return (
    <main style={{
      display: "flex",
      flexDirection: "row",
    }}>
      {
        arr.map((i) => {
          return <Wallet key={i} />
        })
      }
      <button
        onClick={() => {
          setArr([...arr, arr.length + 1]);
        }}
      >
        +
      </button>
    </main>
  );
}

export default App;