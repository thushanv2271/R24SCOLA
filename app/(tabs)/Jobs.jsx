import { useEffect } from "react";
import { useRouter } from "expo-router";
import { setExploreTab } from "../../components/exploreTabStore";

// Jobs now lives inside Explore (swipe/switch). This route only exists so
// links to "/Jobs" (Home, side menu) keep working.
export default function JobsRedirect() {
  const router = useRouter();
  useEffect(() => {
    setExploreTab("jobs");
    router.navigate("/Scholarships");
  }, []);
  return null;
}
