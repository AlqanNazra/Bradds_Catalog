import { Link } from 'react-router-dom';

import type { Collection } from '../../types/catalog';

import { SmartImage } from '../common/SmartImage';

import './CollectionSection.css';

interface CollectionSectionProps {
  collection: Collection;
}

export function CollectionSection({
  collection,
}: CollectionSectionProps) {

  return (
    <Link
      to={`/collections/${collection.slug}`}
      className="collection-section"
    >

      <div className="collection-section__image">

        <SmartImage
          src={collection.image_url}
          alt={collection.name}
        />

      </div>


      <div className="collection-section__content">

        <h3 className="collection-section__title">
          {collection.name}
        </h3>

        {collection.description && (
          <p className="collection-section__description">
            {collection.description}
          </p>
        )}

        <span className="collection-section__link">
          Explore Now! →
        </span>

      </div>

    </Link>
  );
}