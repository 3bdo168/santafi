import { createContext, useContext } from "react";

export const ClientAuthContext = createContext();

export const useClientAuth = () => useContext(ClientAuthContext);
