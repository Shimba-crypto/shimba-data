import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";
import { generateQR, paymentQR, genCardNumber, genCVV, genExpiry } from "../lib/qr.ts";

export default function Card({ token, user }: { token?: string; user?: any }) {
  usePageTitle("Digital Cards");
  const [wallet, setWallet] = useState<any>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [expiry, setExpiry] = useState("");
  const [showBack, setShowBack] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMemo, setPayMemo] = useState("");

  function newCard() { setCardNumber(genCardNumber()); setCvv(genCVV()); setExpiry(genExpiry()); }

  useEffect(() => {
    if (!token || !user?.email) return;
    fetch("/api/wallet", { headers: { "X-User-Token": token } }).then((r) => r.json()).then(setWallet).catch(() => {});
    if (!cardNumber) newCard();
  }, [token, user]);

  if (!token) return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Digital Cards</h1>
      <p className="text-gray-500 mt-2 mb-6">Log in to view your cards.</p>
      <Link to="/login" className="bg-gray-900 text-white px-6 py-2 rounded-md text-sm font-medium">Log in</Link>
    </div>
  );

  const qrPayload = paymentQR({ type: "pay", email: user?.email, amount: payAmount ? parseFloat(payAmount) : undefined, memo: payMemo });
  const qrUrl = generateQR(qrPayload, 240);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Digital Cards</h1>
      <p className="text-sm text-gray-500 mt-1">Virtual cards backed by your NexasCoin balance.</p>

      <div className="mt-8 grid sm:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Your Card</h2>
          <div className="perspective-1000">
            <div className={`relative w-full aspect-[1.6/1] transition-transform duration-500 ${showBack ? "[transform:rotateY(180deg)]" : ""}`} style={{ transformStyle: "preserve-3d" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between" style={{ backfaceVisibility: "hidden" }}>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-semibold opacity-80">NexasPay</span>
                  <span className="text-xs opacity-60">NexasCoin</span>
                </div>
                <div>
                  <p className="font-mono text-lg tracking-widest">{cardNumber}</p>
                  <div className="flex justify-between items-end mt-3">
                    <div><p className="text-xs opacity-60">EXPIRES</p><p className="font-mono text-sm">{expiry}</p></div>
                    <div className="text-right"><p className="text-xs opacity-60">CARD HOLDER</p><p className="font-mono text-sm">{user?.email || "YOUR NAME"}</p></div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-violet-700 to-indigo-800 rounded-2xl shadow-lg [transform:rotateY(180deg)]" style={{ backfaceVisibility: "hidden" }}>
                <div className="w-full h-10 bg-black/40 mt-5" />
                <div className="px-6 mt-4">
                  <div className="bg-white/20 rounded px-3 py-2 text-right"><span className="font-mono text-white text-lg tracking-widest">{cvv}</span></div>
                  <p className="text-[10px] text-white/50 mt-1 text-right">CVV</p>
                  <div className="mt-4 flex justify-between items-end">
                    <p className="text-xs text-white/50">Virtual card</p>
                    <p className="font-mono text-sm text-white/70">{wallet ? wallet.balance.toFixed(2) : "0.00"} coins</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowBack(!showBack)} className="text-xs text-gray-500 hover:text-gray-900 border border-gray-300 rounded px-3 py-1">{showBack ? "Show front" : "Show back (CVV)"}</button>
            <button onClick={newCard} className="text-xs text-gray-500 hover:text-gray-900 border border-gray-300 rounded px-3 py-1">New card</button>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Payment QR</h2>
          {!showQR ? (
            <button onClick={() => setShowQR(true)} className="border border-gray-300 rounded-lg p-6 w-full text-center hover:border-gray-400 transition">
              <div className="text-3xl mb-2">📱</div>
              <p className="text-sm text-gray-600">Show QR code</p>
              <p className="text-xs text-gray-400 mt-1">Others scan to pay you</p>
            </button>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <img src={qrUrl} alt="Payment QR" className="mx-auto rounded-lg" width={200} height={200} />
              <p className="text-xs text-gray-500 mt-3">Scan to pay {user?.email}</p>
              <div className="mt-3 space-y-2">
                <input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount (coins, optional)" className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm text-center" />
                <input value={payMemo} onChange={(e) => setPayMemo(e.target.value)} placeholder="Memo (optional)" className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm text-center" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">How it works</h2>
        <ul className="text-sm text-gray-600 space-y-1.5">
          <li>Your card is backed 1:1 by your NexasCoin balance</li>
          <li>Show your QR someone scans pays you instantly in coins</li>
          <li>Spend coins across JohnWeb CooperWeb ShimbaData</li>
          <li>Sell coins back to mobile money anytime</li>
        </ul>
      </div>
    </div>
  );
}
