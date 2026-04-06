import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { useClientBranch } from "../context/ClientBranchContext";
import { useCart } from "../context/CartContext";

const PaymobReturn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedBranch } = useClientBranch();
  const { clearCart } = useCart();

  const [status, setStatus] = useState("verifying"); // verifying | success | failed
  const [message, setMessage] = useState("");

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const transactionId = params.get("id") || params.get("txn_id") || "";
  const successParam = params.get("success");
  const orderId = params.get("merchant_order_id") || sessionStorage.getItem("pendingPaymobOrderId") || "";

  useEffect(() => {
    const run = async () => {
      if (!selectedBranch?.id) {
        setStatus("failed");
        setMessage("لم يتم اختيار الفرع.");
        return;
      }
      if (!orderId || !transactionId) {
        setStatus("failed");
        setMessage("بيانات الدفع ناقصة.");
        return;
      }

      // If Paymob says success=false, we still verify server-side but we can short-circuit UI.
      try {
        const finalize = httpsCallable(functions, "finalizePaymobPayment");
        const res = await finalize({
          branchId: selectedBranch.id,
          orderId,
          transactionId,
        });
        const ok = res?.data?.ok;
        const success = res?.data?.success;
        if (ok && success) {
          setStatus("success");
          setMessage("تم تأكيد الدفع بنجاح.");
          clearCart();
          sessionStorage.removeItem("pendingPaymobOrderId");
          setTimeout(() => navigate("/profile"), 1200);
        } else {
          setStatus("failed");
          setMessage("الدفع لم يكتمل.");
        }
      } catch (err) {
        setStatus("failed");
        setMessage("فشل تأكيد الدفع. حاول مرة أخرى.");
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch?.id]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-dark-900 to-dark-800">
      <div className="glass p-8 rounded-2xl border border-orange-500/20 max-w-md w-full text-center">
        {status === "verifying" && (
          <>
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-white font-bold text-lg mb-2">جاري تأكيد الدفع...</p>
            <p className="text-gray-400 text-sm">من فضلك انتظر ثواني.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <p className="text-white font-bold text-lg mb-2">{message}</p>
            <p className="text-gray-400 text-sm">هنحوّلك على حسابك.</p>
          </>
        )}
        {status === "failed" && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <p className="text-white font-bold text-lg mb-2">{message || "فشل الدفع"}</p>
            <button
              className="mt-5 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl"
              onClick={() => navigate("/checkout")}
            >
              رجوع للـ Checkout
            </button>
            {successParam === "false" && (
              <p className="text-gray-500 text-xs mt-3">Paymob ردّت إن العملية لم تنجح.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymobReturn;

