import React from 'react';
import { render, waitFor } from '@testing-library/react';
import HomePage, { getServerSideProps } from '../pages/company/[id]/application/[applicationId]'
import { useRouter } from 'next/router';

// Mock the necessary modules
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/image', () => {
  return function MockImage(props) {
    return <img {...props} alt={props.alt} />;
  };
});

describe('Application HomePage', () => {
  const mockToken = 'mocked-token';
  const mockProducts = {
    items: [
      {
        is_active: true,
        media: [{ type: 'image', url: 'image1.png' }],
        name: 'Product 1',
        item_code: 'ITEM001',
        brand: { name: 'Brand A' },
        category_slug: 'Category A',
        id: "1"
      },
      {
        is_active: false,
        media: [],
        name: 'Product 2',
        item_code: 'ITEM002',
        brand: { name: 'Brand B' },
        category_slug: 'Category B',
        id: "2"
      },
    ],
  };

  beforeEach(() => {
    // Mock global fetch function
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/token')) {
        return Promise.resolve({
          json: () => Promise.resolve({ accessToken: mockToken }),
        });
      } else if (url.includes('/products') || url.includes('/raw-products')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockProducts),
        });
      }
      return Promise.reject('Unknown API call');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('It should render product list for sales channel', async () => {
    useRouter.mockReturnValue({
      query: { params: { id: 123, applicationId:'000000000000000000000001'} },
    });
    const { getByText, getByTestId } = render(<HomePage products={mockProducts} />);

    await waitFor(() => {
      expect(getByTestId('product-name-1')).toBeInTheDocument();
      expect(getByTestId('product-item-code-1')).toBeInTheDocument();
      expect(getByText('Brand A')).toBeInTheDocument();
      expect(getByText('Category A')).toBeInTheDocument();
    });
  });

  it('should handle errors and return empty products', async () => {
    // Mock fetch to reject
    global.fetch.mockImplementation(() => Promise.reject(new Error('Failed to fetch')));

    const context = {
     params: { id: 123, applicationId:'000000000000000000000001'} 
     }

    const result = await getServerSideProps(context);

    // Ensure the result has an empty products array in case of an error
    expect(result).toEqual({
      props: {
        products: [],
      },
    });
  });

});
