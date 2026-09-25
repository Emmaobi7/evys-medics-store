import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Category } from '../types';

interface CategoryCardProps {
  category: Category;
  onSelect: (categoryId: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onSelect }) => {
  return (
    <div className="category-card" onClick={() => onSelect(category.id)}>
      <div className="category-card-img-wrap">
        <span className="category-item-pill">{category.itemCount} Products</span>
        <img
          src={category.imageUrl}
          alt={category.name}
          loading="lazy"
        />
      </div>

      <div className="category-card-body">
        <h3 className="category-card-title">
          <span>{category.name}</span>
          <ArrowUpRight size={18} />
        </h3>
        <p className="category-card-desc">{category.description}</p>
      </div>
    </div>
  );
};
