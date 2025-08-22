import React from 'react';

interface Resource {
  id: string;
  role: string;
  name?: string;
  intRate: number;
  description?: string;
}

interface RateCardProps {
  resources: Resource[];
}

export function RateCard({ resources }: RateCardProps) {
  return (
    <div>
      Rate card
    </div>
  );
}
