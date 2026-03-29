import { createContext, useContext, useState } from "react";
import { CLIENT } from "../client.config";

export const BRANCHES = CLIENT.branches;

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