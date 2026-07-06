"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";
import { ensureTrialForUser, type TrialInfo } from "@/lib/subscription/trial";

export function useTrialStatus() {
  const [trial, setTrial] = useState<TrialInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const uid = auth.currentUser?.uid;

    if (!uid) {
      setTrial(null);
      setLoading(false);
      return;
    }

    ensureTrialForUser(uid)
      .then((info) => {
        if (alive) setTrial(info);
      })
      .catch((error) => {
        console.warn("[AppMiSalud] No se pudo cargar el estado de prueba.", error);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return { trial, loading };
}
