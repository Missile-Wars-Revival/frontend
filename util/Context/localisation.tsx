import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

// Define the type for the translations
interface Translations {
    usernameprompt: string;
    passwordprompt: string;
    verifypasswordprompt: string;
    signin: string;
    signuplog: string;
}

// Default translations setup
const translations = {
    en: { usernameprompt: 'Username', passwordprompt: 'Password', verifypasswordprompt: 'Verify Password', signin: `Let's Fight!`, signuplog: `Sign up with Email` },
    fr: { usernameprompt: 'Identifiant', passwordprompt: 'Mot de passe', verifypasswordprompt: 'Mot de passe', signin: `Se connecter`, signuplog: `S’inscrire via email` },
};

// Context type
interface LocalizationContextType {
    localization: Translations;
}

export const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

// LocalizationProvider Props Type
interface LocalizationProviderProps {
    children: ReactNode;
}

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({ children }) => {
    const [localization, setLocalization] = useState<Translations>(translations.en); // Default to English

    useEffect(() => {
        const i18n = new I18n(translations);
        i18n.locale = getLocales()[0]?.languageCode ?? 'en';
        setLocalization({
            usernameprompt: i18n.t('usernameprompt'),
            passwordprompt: i18n.t('passwordprompt'),
            verifypasswordprompt: i18n.t('verifypasswordprompt'),
            signin: i18n.t('signin'),
            signuplog: i18n.t('signuplog')
        });
    }, []);

    return (
        <LocalizationContext.Provider value={{ localization }}>
            {children}
        </LocalizationContext.Provider>
    );
};
