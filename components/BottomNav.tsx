
import React from 'react';
import type { NavItem } from '../types';

interface BottomNavProps {
  items: NavItem[];
  activeItem: string;
  onItemClick: (id: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ items, activeItem, onItemClick }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-base-100 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] rounded-t-2xl">
      <div className="flex justify-around items-center h-16">
        {items.map((item) => {
          const isActive = item.id === activeItem;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`flex flex-col items-center justify-center w-full transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-neutral-content hover:text-primary'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs font-medium mt-1 ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;