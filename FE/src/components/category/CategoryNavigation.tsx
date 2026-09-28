import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCategories } from '../../services/catalogApi';
import type { Category } from '../../types/catalog';
import { SmartImage } from '../common/SmartImage';
import './CategoryNavigation.css';

/**
 * Category strip below the hero (mockup: round thumbnails + label). Hidden entirely
 * when the API returns no active categories.
 */
export function CategoryNavigation() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((result) => {
        if (!cancelled) setCategories(result);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="category-nav" aria-labelledby="category-nav-title">
      <h2 id="category-nav-title" className="sr-only">
        Kategori produk
      </h2>
      <ul className="category-nav__list">
        {categories.map((category) => (
          <li key={category.id} className="category-nav__item">
            <Link to={`/categories/${category.slug}`} className="category-nav__link">
              <span className="category-nav__thumb">
                <SmartImage src={category.image_url} alt={category.name} />
              </span>
              <span className="category-nav__label">{category.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
