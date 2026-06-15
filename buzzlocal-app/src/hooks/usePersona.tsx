import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  getMyPersona,
  getContextualSurface,
  getContextualConfig,
  getTimeContext,
  getDayContext,
  DEFAULT_SURFACE,
  type Persona,
  type ContextualSurface,
} from '../services/personaService';

interface PersonaContextValue {
  persona: Persona | null;
  surface: ContextualSurface;
  loading: boolean;
  refresh: () => Promise<void>;
  timeContext: string;
  dayContext: string;
}

const PersonaContext = createContext<PersonaContextValue>({
  persona: null,
  surface: DEFAULT_SURFACE,
  loading: true,
  refresh: async () => {},
  timeContext: 'afternoon',
  dayContext: 'weekday',
});

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [surface, setSurface] = useState<ContextualSurface>(DEFAULT_SURFACE);
  const [loading, setLoading] = useState(true);
  const [timeContext] = useState(getTimeContext());
  const [dayContext] = useState(getDayContext());

  const refresh = async () => {
    setLoading(true);
    try {
      const config = await getContextualConfig();
      if (config.persona) setPersona(config.persona);
      if (config.surface) setSurface(config.surface);
    } catch (e) {
      console.error('Failed to load persona:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <PersonaContext.Provider
      value={{
        persona,
        surface,
        loading,
        refresh,
        timeContext,
        dayContext,
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  return useContext(PersonaContext);
}

export function useContextualFeature(feature: string): boolean {
  const { surface } = usePersona();
  return surface.topFeatures.includes(feature);
}

export function useTabOrder(): string[] {
  const { surface } = usePersona();
  return surface.uiOverrides.tabOrder;
}

export function useHeroSection(): string {
  const { surface } = usePersona();
  return surface.uiOverrides.heroSection;
}
