"use client";
import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export default function WalletDashboard() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/wallet").then(res => res.json()).then(data => {
      setBalance(data.balance);
      setTransactions(data.transactions);
    });
  }, []);

  const handleDeposit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/wallet/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setBalance(data.balance);
      setTransactions(data.transactions);
      setSuccess("Deposit successful");
    } else {
      setError(data.error || "Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/wallet/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setBalance(data.balance);
      setTransactions(data.transactions);
      setSuccess("Withdrawal successful");
    } else {
      setError(data.error || "Withdrawal failed");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Wallet</h2>
      <div className="mb-4">Balance: <span className="font-mono">Ksh {balance}</span></div>
      <div className="flex gap-2 mb-4">
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="border px-2 py-1 rounded"
          placeholder="Amount"
        />
        <button onClick={handleDeposit} disabled={loading || amount <= 0} className="bg-green-500 text-white px-3 py-1 rounded">Deposit</button>
        <button onClick={handleWithdraw} disabled={loading || amount <= 0} className="bg-blue-500 text-white px-3 py-1 rounded">Withdraw</button>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <h3 className="font-semibold mt-6 mb-2">Transactions</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">Date</th>
              <th className="text-left">Type</th>
              <th className="text-right">Amount</th>
              <th className="text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td>{new Date(tx.createdAt).toLocaleString()}</td>
                <td>{tx.type}</td>
                <td className="text-right">{tx.amount > 0 ? "+" : ""}{tx.amount}</td>
                <td>{tx.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
