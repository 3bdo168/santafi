import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LANGUAGE_STORAGE_KEY = "santafe_lang";

export const translations = {
  ar: {
    nav: {
      home: "الرئيسية",
      menu: "القائمة",
      offers: "العروض",
      about: "من نحن",
      contact: "تواصل معنا",
      changeBranch: "تغيير الفرع",
      profile: "حسابي",
      orders: "طلباتي",
      logout: "تسجيل خروج",
      login: "دخول",
    },
    hero: {
      title: "سانتافى",
      subtitle: "أفضل فرايد تشيكن وبرجر في المنصورة وميت غمر والزقازيق",
      description: "استمتع بأشهى الوجبات المقرمشة المحضرة من أجود المكونات الطازجة، مع توصيل سريع لباب بيتك في أقل من 30 دقيقة.",
      orderBtn: "اطلب دلوقتي",
      menuBtn: "شوف القائمة",
    },
    branchSelector: {
      title: "اختار فرعك",
      subtitle: "اختار أقرب فرع ليك واستمتع بالمنيو",
    },
    branches: {
      mansoura: {
        name: "فرع المنصورة",
        area: "المنصورة، الدقهلية",
      },
      mit_ghamr: {
        name: "فرع ميت غمر",
        area: "ميت غمر، الدقهلية",
      },
      zagazig: {
        name: "فرع الزقازيق",
        area: "الزقازيق، الشرقية",
      },
    },
  },
  en: {
    nav: {
      home: "Home",
      menu: "Menu",
      offers: "Offers",
      about: "About",
      contact: "Contact",
      changeBranch: "Change branch",
      profile: "Profile",
      orders: "My orders",
      logout: "Log out",
      login: "Login",
    },
    hero: {
      title: "Santafe",
      subtitle: "The best fried chicken and burgers in Mansoura, Mit Ghamr, and Zagazig",
      description: "Enjoy crispy meals made with fresh, premium ingredients, delivered hot to your door in under 30 minutes.",
      orderBtn: "Order now",
      menuBtn: "View menu",
    },
    branchSelector: {
      title: "Choose your branch",
      subtitle: "Pick the nearest branch and enjoy the menu",
    },
    branches: {
      mansoura: {
        name: "Mansoura Branch",
        area: "Mansoura, Dakahlia",
      },
      mit_ghamr: {
        name: "Mit Ghamr Branch",
        area: "Mit Ghamr, Dakahlia",
      },
      zagazig: {
        name: "Zagazig Branch",
        area: "Zagazig, Sharqia",
      },
    },
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    try {
      const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return savedLanguage === "en" || savedLanguage === "ar" ? savedLanguage : "ar";
    } catch {
      return "ar";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // localStorage can be unavailable in some private browsing contexts.
    }

    document.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((current) => (current === "ar" ? "en" : "ar"));
  };

  const value = useMemo(
    () => ({
      language,
      toggleLanguage,
      t: translations[language],
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
