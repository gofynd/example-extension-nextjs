import React from 'react';
import { useRouter } from "next/router";
import "../style/index.css";
import greenDot from "../../../public/assets/green-dot.svg";
import grayDot from "../../../public/assets/grey-dot.svg";
import DEFAULT_NO_IMAGE from "../../../public/assets/default_icon_listing.png"
import Image from 'next/image'

const HomePage = ({ products =[] }) => {  
  const DOC_URL_PATH = "/help/docs/sdk/latest/platform/company/catalog/#getProducts";
  const DOC_APP_URL_PATH = "/help/docs/sdk/latest/platform/application/catalog#getAppProducts";
  const router = useRouter();
  const { query } = router;
  const applicationId = query.params[2] || null; // Second segment is optional (application ID)
  const documentationUrl ='https://api.fynd.com'
  
  const isApplicationLaunch = () => !!applicationId;
  const getDocumentPageLink = () => {
    return documentationUrl
      .replace("api", "partners")
      .concat(isApplicationLaunch() ? DOC_APP_URL_PATH : DOC_URL_PATH);
  };
  const productProfileImage = (media) => {
    if (!media || !media.length) {
      return DEFAULT_NO_IMAGE;
    }
    const profileImg = media.find(m => m.type === "image");
    return profileImg?.url || DEFAULT_NO_IMAGE;
  };
  
  return (
    <div className="products-container">
      <div className="title">
        This is an example extension home page user interface.
      </div>
      <div className="section">
        <div className="heading">
          <span>Example-- {isApplicationLaunch() ? 'Application API' : 'Platform API'}</span> :
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
                  <Image src={productProfileImage(product.media)} alt={product.name} height={100} width={100} />
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

export async function getServerSideProps(context) {
  try {
    const { params } = context;
    const companyId = params.params[0];  // First segment is always the company ID
    const applicationId = params.params[2] || null; // Second segment is optional (application ID)

    // Fetch the token using async/await
    const tokenResponse = await fetch(`${process.env.EXTENSION_BASE_URL}/api/token`);
    const tokenData = await tokenResponse.json();

    // Use the token in the Authorization header to fetch products
    const requestOptions = {
      method: 'GET',
      headers: {
        'Authorization': tokenData.accessToken, // Use the fetched token here
      },
      redirect: 'follow'
    };

    // Fetch the products using the token
    let fetchCompanyProducts = `https://api.fynd.com/service/platform/catalog/v1.0/company/${companyId}/products/`;
    
    let fetchApplicationProducts = `https://api.fynd.com/service/platform/catalog/v1.0/company/${companyId}/application/${applicationId}/raw-products/`;
    const productsResponse = await fetch(applicationId ? fetchApplicationProducts : fetchCompanyProducts, requestOptions);
    const products = await productsResponse.json(); // Parse the products response as JSON
    
    // Return the products as props
    return {
      props: { products }, // Pass products data to the page
    };

  } catch (error) {
    console.error('Error fetching data:', error);

    // Return fallback props in case of error
    return {
      props: {
        products: [], // Return an empty array if there's an error
      },
    };
  }
}


export default HomePage;