const API_DOMAIN = process.env.EXTENSION_CLUSTER_URL || 'https://api.fynd.com';
import HomePage from '../../components/HomePage';


// Fetch server-side props for the HomePage
export async function getServerSideProps(context) {
    try {
        const { id } = context.params;

        // Fetch the access token using async/await
        const tokenResponse = await fetch(`${process.env.EXTENSION_BASE_URL}/api/token`);
        const tokenData = await tokenResponse.json();

        // Use the token in the Authorization header to fetch products
        const requestOptions = {
            method: 'GET',
            headers: {
                'Authorization': tokenData.accessToken, // Use the fetched token here
            },
            redirect: 'follow',
        };

        // Fetch products based on whether an application ID is provided
        const fetchCompanyProductsUrl = `${API_DOMAIN}/service/platform/catalog/v1.0/company/${id}/products/`;
        const productsResponse = await fetch(fetchCompanyProductsUrl, requestOptions);
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