import { useEffect, useState } from "react";
import { KEY, SEED, type Faculty } from "@/components/FacultyTab";

export function useFacultyDirectory(isDemo?: boolean) {
  const [faculty, setFaculty] = useState(SEED);
  useEffect(() => {
    if (isDemo) { setFaculty(SEED); return; }
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null") as Faculty[] | null;
      setFaculty(Array.isArray(saved) ? saved : SEED);
    } catch { setFaculty(SEED); }
  }, [isDemo]);
  return faculty;
}