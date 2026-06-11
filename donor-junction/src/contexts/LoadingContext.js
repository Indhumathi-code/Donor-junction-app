import React, { createContext, useState, useContext, useRef } from 'react';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const lockRef = useRef(false);

  const showLoading = () => {
    if (lockRef.current) return;
    setIsLoading(true);
  };

  const hideLoading = () => {
    if (lockRef.current) return;
    setIsLoading(false);
  };

  const showLoadingLocked = (duration) => {
    if (lockRef.current) return;
    setIsLoading(true);
    lockRef.current = true;
    setTimeout(() => {
      lockRef.current = false;
      setIsLoading(false);
    }, duration);
  };

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading, showLoadingLocked }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
