import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAccess = async () => {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("username="));

      if (!cookie) {
        window.location.href = "/azp"; // full reload
        return;
      }

      const username = cookie.split("=")[1];

      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/users?select=account_type&username=eq.${username}`,
          {
            headers: {
              apikey: SUPABASE_API_KEY,
              Authorization: `Bearer ${SUPABASE_API_KEY}`,
            },
          }
        );

        const data = await res.json();

        if (!data.length) {
          window.location.href = "/azp"; // full reload
          return;
        }

        const { account_type } = data[0];
        const isStudent = account_type === "student";
        const isRestrictedRoute = ["/upload", "/myupload"].includes(location.pathname);

        if (isStudent && isRestrictedRoute) {
          window.location.href = "/profile"; // full reload
          return;
        }
      } catch (error) {
        console.error("Access check failed:", error);
        window.location.href = "/azp"; // fallback
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [location.pathname]);

  if (isLoading) return null;

  return <>{children}</>;
}
