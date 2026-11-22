import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Tiny translation layer: the English text is the key. Anything missing falls back to English.
// Covers the student-facing screens and navigation (admin screens stay in English).
const HI = {
  // navigation / layout
  'Dashboard': 'डैशबोर्ड', 'Find Scholarships': 'छात्रवृत्ति खोजें', 'My Bookmarks': 'मेरे बुकमार्क', 'My Applications': 'मेरे आवेदन',
  'Profile': 'प्रोफ़ाइल', 'Notifications': 'सूचनाएँ', 'Logout': 'लॉग आउट', 'Account': 'खाता', 'Scholarships': 'छात्रवृत्तियाँ',
  'Applications': 'आवेदन', 'Students': 'छात्र', 'Student': 'छात्र', 'Admin': 'एडमिन', 'Find · Apply · Achieve': 'खोजें · आवेदन करें · पाएँ',
  'Search scholarships (e.g. AICTE, state, course…)': 'छात्रवृत्ति खोजें (जैसे AICTE, राज्य, कोर्स…)', 'View all': 'सभी देखें',
  'Nothing new yet. We will alert you in real time.': 'अभी कुछ नया नहीं। हम आपको तुरंत सूचित करेंगे।',
  // auth
  'Welcome back': 'वापसी पर स्वागत है', 'Log in to see your matches.': 'अपने मैच देखने के लिए लॉग इन करें।', 'Email': 'ईमेल', 'Password': 'पासवर्ड',
  'Log in': 'लॉग इन', 'Logging in…': 'लॉग इन हो रहा है…', 'New here?': 'नए हैं?', 'Create an account': 'खाता बनाएँ',
  'Create your account': 'अपना खाता बनाएँ', 'It takes a minute, then add your profile once.': 'बस एक मिनट लगेगा, फिर एक बार प्रोफ़ाइल भरें।',
  'Full name': 'पूरा नाम', 'Already registered?': 'पहले से पंजीकृत हैं?', 'Create account': 'खाता बनाएँ', 'Creating…': 'बन रहा है…',
  'Forgot password?': 'पासवर्ड भूल गए?', 'Reset your password': 'पासवर्ड रीसेट करें', 'Send reset link': 'रीसेट लिंक भेजें', 'Back to login': 'लॉग इन पर वापस',
  'New password': 'नया पासवर्ड', 'Confirm password': 'पासवर्ड की पुष्टि करें', 'Update password': 'पासवर्ड अपडेट करें',
  // dashboard
  'Hi': 'नमस्ते', 'Your Smart Scholarship Finder': 'आपका स्मार्ट छात्रवृत्ति खोजक',
  'Discover the best scholarships based on your profile and build a brighter future.': 'अपनी प्रोफ़ाइल के आधार पर सबसे अच्छी छात्रवृत्तियाँ खोजें और बेहतर भविष्य बनाएँ।',
  'Find Eligible Scholarships →': 'पात्र छात्रवृत्तियाँ खोजें →', 'Complete your profile →': 'अपनी प्रोफ़ाइल पूरी करें →',
  'Available Scholarships': 'उपलब्ध छात्रवृत्तियाँ', 'Eligible for You': 'आपके लिए पात्र', 'Closing Soon (within 7 days)': 'जल्द बंद (7 दिन में)',
  'Bookmarked': 'बुकमार्क किए', 'View All →': 'सभी देखें →', 'Closing in 7 Days': '7 दिन में बंद', 'Almost eligible': 'लगभग पात्र',
  'Only one rule is not met': 'सिर्फ एक नियम पूरा नहीं हो रहा', 'My Profile Summary': 'मेरी प्रोफ़ाइल सारांश', 'Edit Profile': 'प्रोफ़ाइल बदलें',
  'Profile completeness': 'प्रोफ़ाइल पूर्णता', 'Application Tracker': 'आवेदन ट्रैकर', 'Apply Now': 'अभी आवेदन करें',
  'Potential support': 'संभावित सहायता', 'Up to': 'अधिकतम', 'per year across': 'प्रति वर्ष, कुल', 'scholarships you are eligible for': 'छात्रवृत्तियों के लिए आप पात्र हैं',
  // find
  'Search, filter and see exactly why you are (or are not) eligible.': 'खोजें, फ़िल्टर करें और देखें कि आप पात्र क्यों हैं (या क्यों नहीं)।',
  'Search by name, provider or keyword': 'नाम, प्रदाता या कीवर्ड से खोजें', 'Category': 'श्रेणी', 'Course': 'कोर्स', 'State': 'राज्य',
  'Merit / Welfare': 'मेरिट / कल्याण', 'Family income (₹)': 'पारिवारिक आय (₹)', 'Sort: Deadline': 'क्रम: अंतिम तिथि', 'Sort: Highest amount': 'क्रम: सबसे अधिक राशि',
  'Sort: Newest': 'क्रम: नवीनतम', 'Only eligible for me': 'सिर्फ मेरे लिए पात्र', 'Clear': 'हटाएँ', 'No scholarships found': 'कोई छात्रवृत्ति नहीं मिली',
  'Compare': 'तुलना करें', 'View details': 'विवरण देखें', 'Compare now': 'अभी तुलना करें', 'Last date': 'अंतिम तिथि', 'per year': 'प्रति वर्ष',
  // applications
  'Scholarships you saved for later.': 'जो छात्रवृत्तियाँ आपने बाद के लिए सहेजी हैं।', 'Track every application through the NSP stages.': 'हर आवेदन को NSP के चरणों में ट्रैक करें।',
  'No bookmarks yet': 'अभी कोई बुकमार्क नहीं', 'No applications yet': 'अभी कोई आवेदन नहीं', 'Open official site': 'आधिकारिक साइट खोलें',
  'Mark as applied': 'आवेदित चिह्नित करें', 'Undo apply': 'आवेदन वापस लें', 'Remove': 'हटाएँ', 'Documents ready': 'दस्तावेज़ तैयार', 'Documents checklist': 'दस्तावेज़ चेकलिस्ट',
  // statuses
  'Applied': 'आवेदित', 'Institute verification': 'संस्थान सत्यापन', 'L2 verification': 'L2 सत्यापन', 'Sanctioned': 'स्वीकृत', 'Payment released': 'भुगतान जारी', 'Rejected': 'अस्वीकृत',
  // profile / account
  'Student Profile': 'छात्र प्रोफ़ाइल', 'Fill this once. We use it to match you with scholarships.': 'इसे एक बार भरें। हम इससे आपको छात्रवृत्तियों से मिलाते हैं।',
  'Completeness': 'पूर्णता', 'Annual family income (₹)': 'वार्षिक पारिवारिक आय (₹)', 'Marks (%)': 'अंक (%)', 'Save profile': 'प्रोफ़ाइल सहेजें', 'Saving…': 'सहेजा जा रहा है…',
  'Select category': 'श्रेणी चुनें', 'Select course': 'कोर्स चुनें', 'Select state': 'राज्य चुनें',
  'Change password': 'पासवर्ड बदलें', 'Current password': 'मौजूदा पासवर्ड', 'Account settings': 'खाता सेटिंग',
  'Live updates: new matching scholarships and application status changes.': 'लाइव अपडेट: नई मेल खाती छात्रवृत्तियाँ और आवेदन की स्थिति में बदलाव।',
  'You are all caught up': 'सब कुछ देख लिया', 'Clear all': 'सभी हटाएँ',
};

const LangContext = createContext({ lang: 'en', setLang: () => {}, t: (s) => s });
export const useLang = () => useContext(LangContext);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('sm_lang') || 'en'; } catch { return 'en'; }
  });
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem('sm_lang', l); } catch { /* ignore */ }
  }, []);
  const t = useCallback((s) => (lang === 'hi' && HI[s]) || s, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
