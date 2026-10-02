import { FeatureGate } from '@/lib/FeatureGate';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <FeatureGate feature='tournaments'>{children}</FeatureGate>;
}
