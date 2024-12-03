import React from 'react';
import { render, waitFor } from '@testing-library/react';
import HomePage, { getServerSideProps } from '../pages/company/[id]/application/[applicationId]'
import { useRouter } from 'next/router';
import { getSessionFromRequest } from '../../session/sessionUtils';

// Mock the necessary modules
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/image', () => {
  return function MockImage(props) {
    return <img {...props} alt={props.alt} />;
  };
});

jest.mock('../../session/sessionUtils', () => ({
  getSessionFromRequest: jest.fn(),
}));

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
    jest.clearAllMocks();

    const mockSession = { access_token: mockToken };
    getSessionFromRequest.mockResolvedValue(mockSession);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProducts),
    });
  });

  it('should render product list for application', async () => {
    useRouter.mockReturnValue({
      query: { applicationId: '000000000000000000000001' },
    });

    const { getByText, getByTestId } = render(<HomePage products={mockProducts} />);

    await waitFor(() => {
      expect(getByTestId('product-name-1')).toBeInTheDocument();
      expect(getByTestId('product-item-code-1')).toBeInTheDocument();
      expect(getByTestId('product-brand-name-1')).toHaveTextContent('Brand A');
      expect(getByTestId('product-category-slug-1')).toHaveTextContent('Category: Category A');
    });
  });

  it('SSR: Should fetch product list for application', async () => {
    const context = {
      params: { id: "123", applicationId: '000000000000000000000001' },
      req: {
        headers: {
          cookie: 'mockedCookie=mockedValue',
        },
      },
    };

    const result = await getServerSideProps(context);

    expect(getSessionFromRequest).toHaveBeenCalledWith(context.req, '123');

    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.FP_API_DOMAIN}/service/platform/catalog/v1.0/company/123/application/000000000000000000000001/raw-products/`,
      {
        method: 'GET',
        headers: {
          Authorization: mockToken,
        },
        redirect: 'follow',
      }
    );

    expect(result).toEqual({
      props: {
        products: mockProducts,
      },
    });
  });

  it('should handle errors and return empty products', async () => {
    getSessionFromRequest.mockResolvedValue(null);

    const context = {
      params: { id: '123', applicationId: '000000000000000000000001' },
      req: {},
    };

    const result = await getServerSideProps(context);

    expect(result).toEqual({
      props: {
        products: [],
      },
    });
  });
});
