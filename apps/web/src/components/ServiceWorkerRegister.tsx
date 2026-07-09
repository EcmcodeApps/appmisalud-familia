"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[MiSalud FamilIA] SW registrado:", reg.scope))
        .catch((err) => console.warn("[MiSalud FamilIA] SW falló:", err));
    }
  }, []);

  return null;
}
