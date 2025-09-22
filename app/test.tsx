"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function TestPage() {
  useEffect(() => {
    const checkTable = async () => {
      const { data, error } = await supabase.from("farmers").select("*").limit(1);
      if (error) {
        alert("ERROR: " + error.message);
        console.error(error);
      } else {
        alert("SUCCESS! Connected to farmers table.");
        console.log("Data:", data);
      }
    };

    checkTable();
  }, []);

  return <div>Checking connection...</div>;
}