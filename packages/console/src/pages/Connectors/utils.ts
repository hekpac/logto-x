import type { ConnectorFactoryResponse, ConnectorResponse } from '@logto/schemas';
import { ConnectorType } from '@logto/schemas';

import type { ConnectorGroup } from '@/types/connector';

export const getConnectorGroups = <
  T extends ConnectorResponse | ConnectorFactoryResponse = ConnectorResponse,
>(
  connectors: T[]
) => {
  return Object.values(
    Array.groupBy(connectors, (item) =>
      item.type === ConnectorType.Social ? item.target : item.id
    )
  ).map((items) => {
    const [first] = items;

    return {
      id: first.id, // Take first connector's id as groupId, only used for indexing.
      isDemo: first.isDemo,
      name: first.name,
      logo: first.logo,
      logoDark: first.logoDark,
      description: first.description,
      target: first.target,
      type: first.type,
      isStandard: first.isStandard,
      connectors: items,
    } as ConnectorGroup<T>;
  });
};

export const splitMarkdownByTitle = (markdown: string) => {
  const match = /# (.*)/.exec(markdown);

  const title = (match ? match[1] : '') ?? '';

  return {
    title,
    content: markdown.replace(title, ''),
  };
};
