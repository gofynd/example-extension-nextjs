import HomePage from '../../components/HomePage';
import getProducts from '../../utils/getProducts';

export async function getServerSideProps(context) {
  try {
    const { id } = context.params;
    const products = await getProducts(id, context.req);

    return {
      props: { products },
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

export default HomePage;