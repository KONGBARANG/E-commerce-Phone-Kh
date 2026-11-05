import { Children, cloneElement, isValidElement, useEffect, useMemo, useState } from 'react';
import { LanguageContext } from './LanguageContext';
import { useLanguage } from './useLanguage';
import { translateText } from './translations';

function translateTree(node, language) {
  if (typeof node === 'string') return translateText(node, language);
  if (Array.isArray(node)) return Children.map(node, (child) => translateTree(child, language));
  if (!isValidElement(node)) return node;

  const props = {};
  for (const [key, value] of Object.entries(node.props)) {
    if (key === 'children') continue;
    props[key] = typeof value === 'string' && ['aria-label', 'alt', 'placeholder', 'title', 'eyebrow', 'description', 'label'].includes(key)
      ? translateText(value, language)
      : value;
  }
  props.children = translateTree(node.props.children, language);
  return cloneElement(node, props);
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('phonekh-language') === 'en' ? 'en' : 'km');

  useEffect(() => {
    localStorage.setItem('phonekh-language', language);
    document.documentElement.lang = language === 'en' ? 'en' : 'km';
    document.title = language === 'en'
      ? 'PHONE KH — Phones & Accessories'
      : 'PHONE KH — ទូរស័ព្ទ និងគ្រឿងបន្លាស់';
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function TranslateTree({ children }) {
  const { language } = useLanguage();
  return translateTree(children, language);
}
