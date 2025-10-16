import { useNavigate, useLocation } from "react-router-dom";
import { logNavigationEvent } from "@/lib/navigationLogger";

export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const canGoBack = () => {
    return typeof window !== "undefined" && window.history.length > 1;
  };

  const goBack = () => {
    const hadHistory = canGoBack();
    const from = location.pathname;

    if (hadHistory) {
      logNavigationEvent("nav.back", {
        from,
        to: "previous",
        hadHistory: true,
      });
      navigate(-1);
    } else {
      logNavigationEvent("nav.back", {
        from,
        to: "/",
        hadHistory: false,
      });
      navigate("/");
    }
  };

  const goHome = () => {
    const from = location.pathname;
    logNavigationEvent("nav.home", {
      from,
      to: "/",
      hadHistory: canGoBack(),
    });
    navigate("/");
  };

  return {
    canGoBack: canGoBack(),
    goBack,
    goHome,
  };
};
