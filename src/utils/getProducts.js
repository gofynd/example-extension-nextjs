const { EXTENSION_CLUSTER_URL } = require('./../../config');
const { getSessionFromRequest } = require('./../../session/sessionUtils');

async function getProducts(companyId, req, applicationId = null) {
  try {
    const session = await getSessionFromRequest(req, companyId);

    if (!session) {
      throw new Error('Session not found');
    }

    const access_token = session.access_token;
    if (!access_token) {
      throw new Error('Access token not found in session');
    }

    // Use the token in the Authorization header to fetch products
    const requestOptions = {
      method: 'GET',
      headers: {
        Authorization: access_token,
      },
      redirect: 'follow',
    };

    // Determine the API endpoint based on whether applicationId is provided
    let fetchProductsUrl;
    if (applicationId) {
      fetchProductsUrl = `${EXTENSION_CLUSTER_URL}/service/platform/catalog/v1.0/company/${companyId}/application/${applicationId}/raw-products/`;
    } else {
      fetchProductsUrl = `${EXTENSION_CLUSTER_URL}/service/platform/catalog/v1.0/company/${companyId}/products/`;
    }

    // Fetch products
    const productsResponse = await fetch(fetchProductsUrl, requestOptions);

    if (!productsResponse.ok) {
      throw new Error(`Failed to fetch products: ${productsResponse.statusText}`);
    }

    const products = await productsResponse.json();

    return products;
  } catch (error) {
    console.error('Error in getProducts:', error);
    throw error;
  }
}

module.exports = getProducts;
