import { NameIdFormat, type SamlAcsUrl } from '@logto/schemas';
import { type SamlApplicationDetails } from '#src/queries/saml-application/index.js';
import assertThat from '#src/utils/assert-that.js';

class SamlApplicationConfig {
  constructor(
    private readonly _details: SamlApplicationDetails,
    private readonly _endpoint: URL
  ) {}

  private normalizeUrlHost(url: string): string {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.host !== this._endpoint.host) {
        // eslint-disable-next-line @silverhand/fp/no-mutation
        parsedUrl.host = this._endpoint.host;
        return parsedUrl.toString();
      }
      return url;
    } catch {
      return url;
    }
  }

  public get secret() {
    return this._details.secret;
  }

  public get spEntityId() {
    assertThat(this._details.entityId, 'application.saml.entity_id_required');
    return this._details.entityId;
  }

  public get acsUrl() {
    assertThat(this._details.acsUrl, 'application.saml.acs_url_required');
    return this._details.acsUrl as SamlAcsUrl;
  }

  public get redirectUri() {
    assertThat(this._details.oidcClientMetadata.redirectUris[0], 'oidc.invalid_redirect_uri');
    return this.normalizeUrlHost(this._details.oidcClientMetadata.redirectUris[0]);
  }

  public get privateKey() {
    assertThat(this._details.privateKey, 'application.saml.private_key_required');
    return this._details.privateKey;
  }

  public get certificate() {
    assertThat(this._details.certificate, 'application.saml.certificate_required');
    return this._details.certificate;
  }

  public get nameIdFormat() {
    return this._details.nameIdFormat as NameIdFormat;
  }

  public get encryption() {
    return this._details.encryption;
  }

  public get attributeMapping() {
    return this._details.attributeMapping;
  }
}

export default SamlApplicationConfig;
