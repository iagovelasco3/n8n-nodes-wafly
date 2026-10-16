import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  Icon,
  INodeProperties,
} from 'n8n-workflow';

export class WaflyApi implements ICredentialType {
  name = 'waflyApi';
  displayName = 'Wafly API';
  icon: Icon = 'file:wafly.svg';
  documentationUrl =
    'https://wafly.io/api-docs?utm_source=n8n&utm_medium=community_node&utm_campaign=n8n_integration&utm_content=credential_help';
  properties: INodeProperties[] = [
    {
      displayName: 'Client Token',
      name: 'clientToken',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'Client-Token provided by Wafly',
    },
    {
      displayName: 'Instance',
      name: 'instance',
      type: 'string',
      default: '',
      required: false,
      description: 'Public instance code/ID, not its display name. Required for messaging and session operations.',
    },
    {
      displayName: 'Token',
      name: 'token',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: false,
      description: 'Token of the instance. Required for messaging and session operations.',
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://wafly.com.br/api-bridge-whats',
      required: true,
      description: 'Base URL of the API',
    },
    {
      displayName: 'Management Base URL',
      name: 'managementBaseUrl',
      type: 'string',
      default: '',
      description: 'Optional. Automatically derived from Base URL by replacing /api-bridge-whats with /api-managment. Set this for a custom management service.',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'Client-Token': '={{$credentials.clientToken}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{ $credentials.instance && $credentials.token ? $credentials.baseUrl.replace(/\\/+$/, "") : ($credentials.managementBaseUrl || $credentials.baseUrl.replace(/\\/api-bridge-whats\\/?$/, "/api-managment")).replace(/\\/+$/, "") }}',
      url: '={{ $credentials.instance && $credentials.token ? "/instances/" + encodeURIComponent($credentials.instance) + "/token/" + encodeURIComponent($credentials.token) + "/status" : "/external/instances?limit=1" }}',
      method: 'GET',
    },
  };
}
