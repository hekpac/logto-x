import type { ConnectorFactoryResponse, ConnectorResponse } from '@logto/schemas';
import { ConnectorType } from '@logto/schemas';
import { conditional } from '@silverhand/essentials';

import { ConnectorsTabs } from '@/consts/page-tabs';

import type { ConnectorGroup } from '@/types/connector';

export const getConnectorGroups = <
  T extends ConnectorResponse | ConnectorFactoryResponse = ConnectorResponse,
>(
  connectors: T[]
) => {
  return connectors.reduce<Array<ConnectorGroup<T>>>((previous, item) => {
    const groupIndex = previous.findIndex(
      // Only group social connectors
      ({ target }) => target === item.target && item.type === ConnectorType.Social
    );

    if (groupIndex === -1) {
      return [
        ...previous,
        {
          id: item.id, // Take first connector's id as groupId, only used for indexing.
          isDemo: item.isDemo,
          name: item.name,
          logo: item.logo,
          logoDark: item.logoDark,
          description: item.description,
          target: item.target,
          type: item.type,
          isStandard: item.isStandard,
          connectors: [item],
        },
      ];
    }

    return previous.map((group, index) => {
      if (index !== groupIndex) {
        return group;
      }

      return {
        ...group,
        connectors: [...group.connectors, item],
      };
    });
  }, []);
};

export const splitMarkdownByTitle = (markdown: string) => {
  const match = /# (.*)/.exec(markdown);

  const title = (match ? match[1] : '') ?? '';

  return {
    title,
    content: markdown.replace(title, ''),
  };
};

export const connectorsPathname = '/connectors';

export const getTabPathname = (tab: ConnectorsTabs) =>
  `${connectorsPathname}/${tab}` as const;

export const connectorTypeToTab = (type: ConnectorType): ConnectorsTabs =>
  type === ConnectorType.Social ? ConnectorsTabs.Social : ConnectorsTabs.Passwordless;

export const getConnectorsPathname = (isSocial: boolean) =>
  getTabPathname(isSocial ? ConnectorsTabs.Social : ConnectorsTabs.Passwordless);

export const buildCreatePathname = (connectorType: ConnectorType) =>
  `${getTabPathname(connectorTypeToTab(connectorType))}/create/${connectorType}` as const;

export const buildGuidePathname = (connectorType: ConnectorType, factoryId: string) =>
  `${getTabPathname(connectorTypeToTab(connectorType))}/guide/${factoryId}` as const;

export const buildDetailsPathname = (connectorType: ConnectorType, connectorId: string) =>
  `${getTabPathname(connectorTypeToTab(connectorType))}/${connectorId}` as const;

export const isConnectorType = (value: string): value is ConnectorType =>
  Object.values<string>(ConnectorType).includes(value);

export const parseToConnectorType = (value?: string): ConnectorType | undefined =>
  conditional(value && isConnectorType(value) && value);
