import "@/styles/globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { useEffect, useState } from "react";
import Router from "next/router";
import { FaSpinner } from "react-icons/fa";

/**
 * Web_Place — E-Commerce Storefront Application
 *
 * Standalone Next.js app for the customer-facing store.
 * All pages are wrapped with StoreProvider for auth & cart state.
 */
function MyApp({ Component, pageProps }) {
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    let timer = null;

    const handleStart = () => {
      timer = setTimeout(() => setRouteLoading(true), 120);
    };
    const handleDone = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      setRouteLoading(false);
    };

    Router.events.on("routeChangeStart", handleStart);
    Router.events.on("routeChangeComplete", handleDone);
    Router.events.on("routeChangeError", handleDone);

    return () => {
      if (timer) clearTimeout(timer);
      Router.events.off("routeChangeStart", handleStart);
      Router.events.off("routeChangeComplete", handleDone);
      Router.events.off("routeChangeError", handleDone);
    };
  }, []);

  return (
    <StoreProvider>
      {routeLoading && (
        <>
          <div className="fixed top-0 left-0 right-0 h-1 bg-green-600 z-[70] animate-pulse" />
          <div className="fixed inset-0 bg-black/10 z-[69] flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-md">
              <FaSpinner className="w-5 h-5 text-green-600 animate-spin" />
            </div>
          </div>
        </>
      )}
      <Component {...pageProps} />
    </StoreProvider>
  );
}

export default MyApp;
