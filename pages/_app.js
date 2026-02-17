import "@/styles/globals.css";
import { StoreProvider } from "@/context/StoreContext";

/**
 * Web_Place — E-Commerce Storefront Application
 *
 * Standalone Next.js app for the customer-facing store.
 * All pages are wrapped with StoreProvider for auth & cart state.
 */
function MyApp({ Component, pageProps }) {
  return (
    <StoreProvider>
      <Component {...pageProps} />
    </StoreProvider>
  );
}

export default MyApp;
