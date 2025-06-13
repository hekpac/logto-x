export type CleanOptions = {
  cleanKeys?: string[];
  cleanValues?: unknown[];
  emptyArrays?: boolean;
  emptyObjects?: boolean;
  emptyStrings?: boolean;
  NaNValues?: boolean;
  nullValues?: boolean;
  undefinedValues?: boolean;
};

const defaultOptions: Required<CleanOptions> = {
  cleanKeys: [],
  cleanValues: [],
  emptyArrays: true,
  emptyObjects: true,
  emptyStrings: true,
  NaNValues: true,
  nullValues: true,
  undefinedValues: true,
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const shouldRemove = (value: unknown, options: Required<CleanOptions>): boolean => {
  if (options.cleanValues.includes(value)) {
    return true;
  }

  if (value === undefined) {
    return options.undefinedValues;
  }

  if (value === null) {
    return options.nullValues;
  }

  if (typeof value === 'number' && Number.isNaN(value)) {
    return options.NaNValues;
  }

  if (value === '') {
    return options.emptyStrings;
  }

  if (Array.isArray(value)) {
    return value.length === 0 && options.emptyArrays;
  }

  if (isObject(value)) {
    return Object.keys(value).length === 0 && options.emptyObjects;
  }

  return false;
};

export default function cleanDeep<T>(object: T, opts: CleanOptions = {}): Partial<T> {
  const options = { ...defaultOptions, ...opts };

  const recurse = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      const result = value
        .map((item) => recurse(item))
        .filter((item) => !shouldRemove(item, options));

      return result.length === 0 && options.emptyArrays ? undefined : result;
    }

    if (isObject(value)) {
      const result: Record<string, unknown> = {};

      for (const [key, val] of Object.entries(value)) {
        if (options.cleanKeys.includes(key)) {
          continue;
        }

        const cleaned = recurse(val);

        if (shouldRemove(cleaned, options)) {
          continue;
        }

        result[key] = cleaned;
      }

      return Object.keys(result).length === 0 && options.emptyObjects ? undefined : result;
    }

    return value;
  };

  return recurse(object) as Partial<T>;
}
