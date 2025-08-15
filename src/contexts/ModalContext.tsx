import { createContext, useContext, useState, ReactNode, useMemo } from 'react';

interface ModalContextType {
  matchRecordModalOpen: boolean;
  setMatchRecordModalOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const [matchRecordModalOpen, setMatchRecordModalOpen] = useState(false);

  const value = useMemo(() => ({
    matchRecordModalOpen,
    setMatchRecordModalOpen
  }), [matchRecordModalOpen]);

  return (
    <ModalContext.Provider
      value={value}
    >
      {children}
    </ModalContext.Provider>
  );
};