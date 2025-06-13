import { FlatCompat } from '@eslint/eslintrc';
import eslintrc from './.eslintrc.cjs';

const compat = new FlatCompat({ baseDirectory: import.meta.url });

export default compat.config(eslintrc);
