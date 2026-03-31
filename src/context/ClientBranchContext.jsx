// src/context/ClientBranchContext.jsx
import { createContext, useContext, useState } from "react";

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
  const [selectedBranch, setSelectedBranchState] = useState(() => {
    const saved = sessionStorage.getItem("selectedBranch");
    return saved ? JSON.parse(saved) : null;
  });

  const setSelectedBranch = (branch) => {
    setSelectedBranchState(branch);
    if (branch) {
      sessionStorage.setItem("selectedBranch", JSON.stringify(branch));
    } else {
      sessionStorage.removeItem("selectedBranch");
    }
  };

  return (
    <ClientBranchContext.Provider value={{ selectedBranch, setSelectedBranch }}>
      {children}
    </ClientBranchContext.Provider>
  );
};

export const useClientBranch = () => useContext(ClientBranchContext);