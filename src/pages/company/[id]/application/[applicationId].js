const API_DOMAIN = process.env.FP_API_DOMAIN || 'https://api.fynd.com';
import HomePage from '../../../../components/HomePage';
import getProducts from '../../../../utils/getProducts';

export async function getServerSideProps(context) {
  try {
    const { id: companyId, applicationId } = context.params;
    const products = await getProducts(companyId, context.req, applicationId);

    return {
      props: { products }, // Pass products data to the page
    };
  } catch (error) {
    console.error('Error fetching products:', error);

    // Return fallback props in case of error
    return {
      props: {
        products: [], // Return an empty array if there's an error
      },
    };
  }
}

// Export the HomePage component as default
export default HomePage;
