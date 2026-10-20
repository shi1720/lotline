import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Lotline from "../app/lotline";
import Privacy from "../app/privacy/page";
import { subscribeAuth, type FirebaseUser } from "../lib/firebase-client";
import "../app/globals.css";
function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  useEffect(() => subscribeAuth(setUser), []);
  return <Lotline user={user} />;
}
const privacyRoute =
  window.location.pathname.replace(/\/+$/, "") === "/privacy";
if (privacyRoute) document.title = "Privacy & data handling | Lotline";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>{privacyRoute ? <Privacy /> : <App />}</React.StrictMode>,
);
