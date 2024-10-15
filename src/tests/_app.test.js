import React from 'react';
import { render } from '@testing-library/react';
import MyApp from '../pages/_app';

const MockComponent = () => <div>Mock Component</div>;

describe('MyApp Component', () => {
  it('should render the provided component with pageProps', () => {
    const pageProps = { testProp: 'test value' };

    const { getByText } = render(<MyApp Component={MockComponent} pageProps={pageProps} />);
    expect(getByText('Mock Component')).toBeInTheDocument();
  });
});
