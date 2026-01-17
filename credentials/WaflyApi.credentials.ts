import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class WaflyApi implements ICredentialType {
  name = 'waflyApi';
  displayName = 'Wafly API';
  documentationUrl = 'https://wafly.com.br/docs';
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
      description: 'Client-Token fornecido pela Wafly',
    },
    {
      displayName: 'Instance',
      name: 'instance',
      type: 'string',
      default: '',
      required: true,
      description: 'Nome da instância WhatsApp',
    },
    {
      displayName: 'Token',
      name: 'token',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'Token da instância',
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://wafly.com.br/api-bridge-whats',
      required: true,
      description: 'URL base da API',
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
      baseURL: '={{$credentials.baseUrl}}',
      url: '/instances/={{$credentials.instance}}/token/={{$credentials.token}}/status',
      method: 'GET',
    },
  };
}
