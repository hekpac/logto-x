import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generate a random string with the given length using digits and letters.
 *
 * @param length - Length of the string to generate.
 */
export const generateRandomString = (length: number) => customAlphabet(alphabet, length)();

