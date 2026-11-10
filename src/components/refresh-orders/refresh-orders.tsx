"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
//check para apgar o no el auto refresh

export default function RefreshOrders() {
  const router = useRouter();
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    //si el check no esta prendido no hace nada
    if (!autoRefresh) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, 25_000); //25 

    return () => window.clearInterval(timer);
  }, [autoRefresh, router]);

  return (
    <div>
      <button type="button" onClick={() => router.refresh()}>
        Actualizar
      </button>
      <label>
        <input
          type="checkbox"
          checked={autoRefresh}
          //si se le da click va a hacer un auto refresh cada cierto tiempo 
          onChange={(event) => setAutoRefresh(event.target.checked)}
        />
        Actualizar automáticamente
      </label>
    </div>
  );
}