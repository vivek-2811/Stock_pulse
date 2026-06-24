import React from 'react';

interface CategoryPillsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Income', value: 'income' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Dining', value: 'dining' },
  { label: 'Groceries', value: 'groceries' },
  { label: 'Subscriptions', value: 'subscriptions' },
  { label: 'Transport', value: 'auto & transport' }
];

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-border-glass">
      {CATEGORIES.map((cat) => {
        const isActive = selectedCategory.toLowerCase() === cat.value;
        return (
          <button
            key={cat.value}
            onClick={() => onSelectCategory(cat.value)}
            className={`px-4 py-2 rounded-full border text-xs font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 ${
              isActive
                ? 'bg-app-green/10 text-app-green border-app-green shadow-glow-green-sm'
                : 'bg-surface-low border-border-glass text-text-muted hover:text-white hover:border-white/20 hover:scale-[1.02]'
            }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
};
export default CategoryPills;
