import { render } from '@testing-library/react';


import CodeEditor from '../CodeEditor';

describe('<CodeEditor /> error handling', () => {
  it('shows custom error message', () => {
    const { getByText } = render(
      <CodeEditor value="" onChange={() => {}} error="custom" />
    );
    expect(getByText('custom')).toBeInTheDocument();
  });

  it('shows default required message when error is boolean', () => {
    const { getByText } = render(
      <CodeEditor value="" onChange={() => {}} error={true} />
    );
    expect(getByText('general.required')).toBeInTheDocument();
  });

  it('shows default required message when error is empty string', () => {
    const { getByText } = render(
      <CodeEditor value="" onChange={() => {}} error="" />
    );
    expect(getByText('general.required')).toBeInTheDocument();
  });
});
