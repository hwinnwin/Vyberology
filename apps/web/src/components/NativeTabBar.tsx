import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Sparkles, Heart, Clock, Settings } from 'lucide-react';
import { isNative } from '@/lib/platform';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/numerology', icon: Sparkles, label: 'Reading' },
  { path: '/compatibility', icon: Heart, label: 'Compat' },
  { path: '/history', icon: Clock, label: 'History' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function NativeTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  if (!isNative()) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
         style={{ paddingBottom: 'var(--safe-area-bottom)' }}>
      <div className="flex justify-around items-center h-16">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
