import { createContext, useContext, ReactNode } from "react";
import { useCustomDomain } from "@/hooks/useCustomDomain";

interface CustomDomainContextType {
    isCustomDomain: boolean;
    companyId: string | null;
    companySlug: string | null;
    domain: string | null;
    isLoading: boolean;
}

const CustomDomainContext = createContext<CustomDomainContextType>({
    isCustomDomain: false,
    companyId: null,
    companySlug: null,
    domain: null,
    isLoading: true,
});

export const useCustomDomainContext = () => useContext(CustomDomainContext);

interface CustomDomainProviderProps {
    children: ReactNode;
}

export const CustomDomainProvider = ({ children }: CustomDomainProviderProps) => {
    const customDomainData = useCustomDomain();

    return (
        <CustomDomainContext.Provider value={customDomainData}>
            {children}
        </CustomDomainContext.Provider>
    );
};
