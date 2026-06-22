import { createContext, useContext } from 'react';

export const ScrapingContext = createContext({
  scrapeStatuses: {},
  scrapeQueue: async () => {},
  retryOne: async () => {},
});

export const useScraping = () => useContext(ScrapingContext);
