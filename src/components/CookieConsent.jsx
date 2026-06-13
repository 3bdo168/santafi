import { useEffect, useState } from "react";

const STORAGE_KEY = "santafe_cookie_consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.__PRERENDER_INJECTED__?.isPrerender) return;
    setVisible(!localStorage.getItem(STORAGE_KEY));
  }, []);

  const handleChoice = (choice) => {
    localStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4" dir="rtl">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-lg border border-orange-500/30 bg-zinc-950/95 p-4 text-white shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold text-gray-100">
          نستخدم ملفات تعريف الارتباط لتحسين تجربتك
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleChoice("accepted")}
            className="rounded-md bg-yellow-400 px-5 py-2 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
          >
            قبول
          </button>
          <button
            type="button"
            onClick={() => handleChoice("rejected")}
            className="rounded-md border border-white/20 px-5 py-2 text-sm font-bold text-white transition hover:border-white/50"
          >
            رفض
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
