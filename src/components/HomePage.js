import React from 'react';
import { useRouter } from 'next/router';
import greenDot from '../../public/assets/green-dot.svg';
import grayDot from '../../public/assets/grey-dot.svg';
import DEFAULT_NO_IMAGE from '../../public/assets/default_icon_listing.png';
import Image from 'next/image';

// Base URL for API requests
const documentationUrl = 'https://api.fynd.com';
const DOC_URL_PATH = '/help/docs/sdk/latest/platform/company/catalog/#getProducts';
const DOC_APP_URL_PATH = '/help/docs/sdk/latest/platform/application/catalog#getAppProducts';

// HomePage component to display products
const HomePage = ({ products = [] }) => {
  const router = useRouter();
  const { query } = router;
  const applicationId = query?.applicationId || null; // Extract optional application ID from query

  // Determine if the application is launched
  const isApplicationLaunch = () => !!applicationId;

  // Construct the appropriate documentation link
  const getDocumentPageLink = () => {
    return documentationUrl
      .replace('api', 'partners')
      .concat(isApplicationLaunch() ? DOC_APP_URL_PATH : DOC_URL_PATH);
  };

  // Get product profile image or default image if not available
  const getProductProfileImage = (media) => {
    if (!media || !media.length) {
      return DEFAULT_NO_IMAGE;
    }
    const profileImg = media.find((m) => m.type === 'image');
    return profileImg?.url || DEFAULT_NO_IMAGE;
  };

  return (
    <div className="products-container">
      <div className="title">
        This is an example extension home page user interface.
      </div>
      <div className="section">
        <div className="heading">
          <span>Example {isApplicationLaunch() ? 'Application API' : 'Platform API'}</span> :
          <a href={getDocumentPageLink()} target="_blank" rel="noopener noreferrer">
            {isApplicationLaunch() ? 'getAppProducts' : 'getProducts'}
          </a>
        </div>
        <div className="description">
          This is an illustrative Platform API call to fetch the list of products
          in this company. Check your extension folder’s 'server.js'
          file to know how to call Platform API and start calling API you
          require.
        </div>
      </div>

      <div>
        {products && products.items?.map((product, index) => (
          <div className="product-list-container flex-row" key={`product-${product.name}-${index}`}>
            <Image className="mr-r-12" src={product.is_active ? greenDot : grayDot} alt="status" height={10} width={10} />
            <div className="card-avatar mr-r-12">
              <Image src={getProductProfileImage(product.media)} alt={product.name} height={100} width={100} />
            </div>
            <div className="flex-column">
              <div className="flex-row">
                <div className="product-name" data-testid={`product-name-${product.id}`}>
                  {product.name}
                </div>
                <div className="product-item-code">|</div>
                {product.item_code && (
                  <span className="product-item-code">
                    Item Code:
                    <span className="cl-RoyalBlue" data-testid={`product-item-code-${product.id}`}>
                      {product.item_code}
                    </span>
                  </span>
                )}
              </div>
              {product.brand && (
                <div className="product-brand-name" data-testid={`product-brand-name-${product.id}`}>
                  {product.brand.name}
                </div>
              )}
              {product.category_slug && (
                <div className="product-category" data-testid={`product-category-slug-${product.id}`}>
                  Category: <span>{product.category_slug}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;