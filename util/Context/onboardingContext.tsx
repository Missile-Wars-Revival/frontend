import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OnboardingStep = 'store' | 'filter_missiles' | 'buy_missile' | 'filter_landmines' | 'buy_landmine' | 'go_to_cart' | 'checkout' | 'fire' | 'friends' | 'fire_landmine' | 'choosefire_landmine' | 'selectlandmine_location' | 'place_landmine' | 'playermenu' | 'fireplayermenu' | 'choosemissile_fireplayermenu'| 'confirmmissile_fireplayermenu' | 'completed';

interface OnboardingContextType {
    currentStep: OnboardingStep;
    setCurrentStep: (step: OnboardingStep) => void;
    isOnboardingComplete: boolean;
    completeOnboarding: () => void;
    moveToNextStep: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('store');
    const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

    useEffect(() => {
        const checkOnboardingStatus = async () => {
            const status = await AsyncStorage.getItem('onboardingComplete');
            setIsOnboardingComplete(status === 'true');
        };
        checkOnboardingStatus();
    }, []);

    const completeOnboarding = async () => {
        await AsyncStorage.setItem('onboardingComplete', 'true');
        setIsOnboardingComplete(true);
    };

    const moveToNextStep = () => {
        setCurrentStep(prevStep => {
            switch (prevStep) {
                case 'store':
                    return 'filter_missiles';
                case 'filter_missiles':
                    return 'buy_missile';
                case 'buy_missile':
                    return 'filter_landmines';
                case 'filter_landmines':
                    return 'buy_landmine';
                case 'buy_landmine':
                    return 'go_to_cart';
                case 'go_to_cart':
                    return 'checkout';
                case 'checkout':
                    return 'fire';
                case 'fire':
                    return 'fire_landmine';
                case 'fire_landmine':
                    return 'choosefire_landmine';
                case 'choosefire_landmine':
                    return 'selectlandmine_location';
                case 'selectlandmine_location':
                    return 'place_landmine';
                case 'place_landmine':
                    return 'playermenu';
                case 'playermenu':
                    return 'fireplayermenu';
                case 'fireplayermenu':
                    return 'choosemissile_fireplayermenu';
                case 'choosemissile_fireplayermenu':
                    return 'confirmmissile_fireplayermenu';
                case 'confirmmissile_fireplayermenu':
                    return 'friends';
                case 'friends':
                    completeOnboarding();
                    return 'completed';
                default:
                    return prevStep;
            }
        });
    };

    return (
        <OnboardingContext.Provider value={{
            currentStep,
            setCurrentStep,
            isOnboardingComplete,
            completeOnboarding,
            moveToNextStep
        }}>
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
};
