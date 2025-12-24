import { ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';

interface CategoryDropdownProps {
  value?: string;
  onChange: (value: string | undefined) => void;
}

export function CategoryDropdown({ value, onChange }: CategoryDropdownProps) {
  const { data: categories } = useCategories();

  return (
    <div className="flex justify-center py-8">
      <Select value={value || 'all'} onValueChange={(v) => onChange(v === 'all' ? undefined : v)}>
        <SelectTrigger className="w-[280px] bg-card border-border text-foreground">
          <SelectValue placeholder="Todas as Categorias" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="all">Todas as Categorias</SelectItem>
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}