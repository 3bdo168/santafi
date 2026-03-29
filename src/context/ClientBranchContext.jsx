// src/context/ClientBranchContext.jsx
// ✅ Context منفصل للكلايت - مش علاقتوش بـ Firebase Auth
import { createContext, useContext, useState } from "react";

// ==========================================
// 🔧 بيانات الفروع - عدّلها حسب اللي عندك
// ==========================================
export const BRANCHES = [
  {
    id: "mansoura",
    name: "فرع المنصورة",
    area: "المنصورة، الدقهلية",
    phone: "010-0000-0001",
    hours: "11:00 ص – 12:00 ص",
  },
  {
    id: "mit_ghamr",
    name: "فرع ميت غمر",
    area: "ميت غمر، الدقهلية",
    phone: "010-0000-0002",
    hours: "12:00 م – 1:00 ص",
  },
  {
    id: "zagazig",
    name: "فرع الزقازيق",
    area: "الزقازيق، الشرقية",
    phone: "010-0000-0003",
    hours: "11:00 ص – 11:00 م",
  },
];

const ClientBranchContext = createContext();

export const ClientBranchProvider = ({ children }) => {
  const [selectedBranch, setSelectedBranch] = useState(null);

  return (
    <ClientBranchContext.Provider value={{ selectedBranch, setSelectedBranch }}>
      {children}
    </ClientBranchContext.Provider>
  );
};

export const useClientBranch = () => useContext(ClientBranchContext);