import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface IconRendererProps extends LucideProps {
  name: string;
}

export function IconRenderer({ name, ...props }: IconRendererProps) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name];
  if (!Icon) {
    const Fallback = Icons.Circle;
    return <Fallback {...props} />;
  }
  return <Icon {...props} />;
}
