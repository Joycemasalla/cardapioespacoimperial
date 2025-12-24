import { Category } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: Category;
  isSelected?: boolean;
  onClick: () => void;
}

export function CategoryCard({ category, isSelected, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all min-w-[100px]",
        isSelected 
          ? "border-primary bg-primary/10 glow-gold" 
          : "border-border bg-card hover:border-primary/50"
      )}
    >
      {category.image_url ? (
        <img 
          src={category.image_url} 
          alt={category.name}
          className="w-16 h-16 object-cover rounded-lg"
        />
      ) : (
        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
          <span className="text-2xl">🍔</span>
        </div>
      )}
      <span className={cn(
        "text-sm font-medium text-center",
        isSelected ? "text-primary" : "text-foreground"
      )}>
        {category.name}
      </span>
    </button>
  );
}
