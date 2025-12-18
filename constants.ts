import React from 'react';
import type { Rank } from './types';

// FIX: Replaced JSX with React.createElement to be compatible with a .ts file extension.
const Medal: React.FC<{ className?: string; medalColor: string; ribbonColor: string }> = ({ className, medalColor, ribbonColor }) => (
    React.createElement('svg',
        {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            className: className,
        },
        React.createElement('path', { d: "M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.5 2.8A2 2 0 0 1 6.3 2h11.4a2 2 0 0 1 1.8 1l1.7 2.1a2 2 0 0 1 .14 2.2L16.79 15", fill: ribbonColor, stroke: ribbonColor, strokeWidth: "1", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('circle', { cx: "12", cy: "17", r: "5", fill: medalColor, stroke: medalColor, strokeWidth: "1" }),
        React.createElement('path', { d: "M11 12 5.12 2.2", stroke: "white", strokeOpacity: "0.5", strokeWidth: "0.5"}),
        React.createElement('path', { d: "m13 12 5.88-9.8", stroke: "white", strokeOpacity: "0.5", strokeWidth: "0.5"}),
        React.createElement('path', { d: "M8 7h8", stroke: "white", strokeOpacity: "0.5", strokeWidth: "0.5"})
    )
);

// FIX: Replaced JSX with React.createElement to be compatible with a .ts file extension.
const CopperMedal: React.FC<{ className?: string }> = ({ className }) => React.createElement(Medal, { className, medalColor: "#b87333", ribbonColor: "#a1331a" });
const BronzeMedal: React.FC<{ className?: string }> = ({ className }) => React.createElement(Medal, { className, medalColor: "#cd7f32", ribbonColor: "#365e8a" });
const SilverMedal: React.FC<{ className?: string }> = ({ className }) => React.createElement(Medal, { className, medalColor: "#c0c0c0", ribbonColor: "#365e8a" });
const GoldMedal: React.FC<{ className?: string }> = ({ className }) => React.createElement(Medal, { className, medalColor: "#ffd700", ribbonColor: "#365e8a" });
const PlatinumMedal: React.FC<{ className?: string }> = ({ className }) => React.createElement(Medal, { className, medalColor: "#e5e4e2", ribbonColor: "#5a2082" });
const DiamondMedal: React.FC<{ className?: string }> = ({ className }) => React.createElement(Medal, { className, medalColor: "#b9f2ff", ribbonColor: "#5a2082" });


export const RANKS: Rank[] = [
  { name: 'Copper', icon: CopperMedal, minWords: 0 },
  { name: 'Bronze', icon: BronzeMedal, minWords: 50 },
  { name: 'Silver', icon: SilverMedal, minWords: 100 },
  { name: 'Gold', icon: GoldMedal, minWords: 200 },
  { name: 'Platinum', icon: PlatinumMedal, minWords: 300 },
  { name: 'Diamond', icon: DiamondMedal, minWords: 500 },
];
