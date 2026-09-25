import React, { useState } from 'react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images, productName }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const displayImages = images.length > 0 ? images : [
    'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80'
  ];

  return (
    <div className="pdp-gallery">
      <div className="pdp-main-image">
        <img
          src={displayImages[selectedIndex]}
          alt={`${productName} view ${selectedIndex + 1}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80';
          }}
        />
      </div>

      {displayImages.length > 1 && (
        <div className="pdp-thumbnails">
          {displayImages.map((img, idx) => (
            <div
              key={idx}
              className={`pdp-thumb ${selectedIndex === idx ? 'active' : ''}`}
              onClick={() => setSelectedIndex(idx)}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
