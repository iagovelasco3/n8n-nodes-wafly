import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
  NodeOperationError,
} from 'n8n-workflow';

export class Wafly implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Wafly WhatsApp',
    name: 'wafly',
    icon: 'file:wafly.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Integração com Wafly WhatsApp Bridge API',
    defaults: {
      name: 'Wafly',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'waflyApi',
        required: true,
      },
    ],
    properties: [
      // Resource
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Instance',
            value: 'instance',
          },
          {
            name: 'Message',
            value: 'message',
          },
          {
            name: 'Group',
            value: 'group',
          },
          {
            name: 'Community',
            value: 'community',
          },
          {
            name: 'Newsletter',
            value: 'newsletter',
          },
          {
            name: 'Chat',
            value: 'chat',
          },
          {
            name: 'Webhook',
            value: 'webhook',
          },
        ],
        default: 'message',
      },

      // =====================================
      // INSTANCE OPERATIONS
      // =====================================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['instance'],
          },
        },
        options: [
          {
            name: 'Get QR Code',
            value: 'getQrCode',
            description: 'Obter QR Code para conectar',
            action: 'Get QR code',
          },
          {
            name: 'Get Status',
            value: 'getStatus',
            description: 'Verificar status da conexão',
            action: 'Get status',
          },
          {
            name: 'Connect',
            value: 'connect',
            description: 'Conectar instância',
            action: 'Connect instance',
          },
          {
            name: 'Disconnect',
            value: 'disconnect',
            description: 'Desconectar instância',
            action: 'Disconnect instance',
          },
          {
            name: 'Restart',
            value: 'restart',
            description: 'Reiniciar instância',
            action: 'Restart instance',
          },
          {
            name: 'Get Device Info',
            value: 'getDevice',
            description: 'Obter informações do dispositivo',
            action: 'Get device info',
          },
          {
            name: 'Check Phone Numbers',
            value: 'checkPhones',
            description: 'Verificar se números existem no WhatsApp',
            action: 'Check phone numbers',
          },
        ],
        default: 'getStatus',
      },

      // =====================================
      // MESSAGE OPERATIONS
      // =====================================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['message'],
          },
        },
        options: [
          {
            name: 'Send Text',
            value: 'sendText',
            description: 'Enviar mensagem de texto',
            action: 'Send text message',
          },
          {
            name: 'Send Image',
            value: 'sendImage',
            description: 'Enviar imagem',
            action: 'Send image',
          },
          {
            name: 'Send Video',
            value: 'sendVideo',
            description: 'Enviar vídeo',
            action: 'Send video',
          },
          {
            name: 'Send Audio',
            value: 'sendAudio',
            description: 'Enviar áudio',
            action: 'Send audio',
          },
          {
            name: 'Send Document',
            value: 'sendDocument',
            description: 'Enviar documento',
            action: 'Send document',
          },
          {
            name: 'Send Location',
            value: 'sendLocation',
            description: 'Enviar localização',
            action: 'Send location',
          },
          {
            name: 'Send Contact',
            value: 'sendContact',
            description: 'Enviar contato',
            action: 'Send contact',
          },
          {
            name: 'Send Poll',
            value: 'sendPoll',
            description: 'Criar enquete',
            action: 'Send poll',
          },
          {
            name: 'Send Link',
            value: 'sendLink',
            description: 'Enviar link com prévia',
            action: 'Send link',
          },
          {
            name: 'Delete Message',
            value: 'deleteMessage',
            description: 'Deletar mensagem',
            action: 'Delete message',
          },
        ],
        default: 'sendText',
      },

      // Phone Number Field (usado por várias operações)
      {
        displayName: 'Phone Number',
        name: 'phone',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: [
              'sendText',
              'sendImage',
              'sendVideo',
              'sendAudio',
              'sendDocument',
              'sendLocation',
              'sendContact',
              'sendPoll',
              'sendLink',
              'deleteMessage',
            ],
          },
        },
        description: 'Número de telefone com DDI (ex: 5511999999999)',
      },

      // Send Text Fields
      {
        displayName: 'Message',
        name: 'message',
        type: 'string',
        typeOptions: {
          rows: 4,
        },
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendText'],
          },
        },
        description: 'Texto da mensagem',
      },

      // Send Image Fields
      {
        displayName: 'Image URL',
        name: 'image',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendImage'],
          },
        },
        description: 'URL da imagem',
      },
      {
        displayName: 'Caption',
        name: 'caption',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendImage', 'sendVideo', 'sendDocument'],
          },
        },
        description: 'Legenda da mídia',
      },

      // Send Video Fields
      {
        displayName: 'Video URL',
        name: 'video',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendVideo'],
          },
        },
        description: 'URL do vídeo',
      },

      // Send Audio Fields
      {
        displayName: 'Audio URL',
        name: 'audio',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendAudio'],
          },
        },
        description: 'URL do áudio',
      },

      // Send Document Fields
      {
        displayName: 'Document URL',
        name: 'document',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendDocument'],
          },
        },
        description: 'URL do documento',
      },
      {
        displayName: 'File Name',
        name: 'fileName',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendDocument'],
          },
        },
        description: 'Nome do arquivo',
      },

      // Send Location Fields
      {
        displayName: 'Latitude',
        name: 'latitude',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendLocation'],
          },
        },
        description: 'Latitude da localização',
      },
      {
        displayName: 'Longitude',
        name: 'longitude',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendLocation'],
          },
        },
        description: 'Longitude da localização',
      },
      {
        displayName: 'Address',
        name: 'address',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendLocation'],
          },
        },
        description: 'Endereço da localização',
      },

      // Send Contact Fields
      {
        displayName: 'Contact Name',
        name: 'contactName',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendContact'],
          },
        },
        description: 'Nome do contato',
      },
      {
        displayName: 'Contact Phone',
        name: 'contactPhone',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendContact'],
          },
        },
        description: 'Telefone do contato',
      },

      // Send Poll Fields
      {
        displayName: 'Poll Question',
        name: 'pollMessage',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendPoll'],
          },
        },
        description: 'Pergunta da enquete',
      },
      {
        displayName: 'Poll Options',
        name: 'pollOptions',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendPoll'],
          },
        },
        description: 'Opções separadas por vírgula (ex: Azul,Verde,Vermelho)',
      },
      {
        displayName: 'Max Options',
        name: 'pollMaxOptions',
        type: 'number',
        default: 1,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendPoll'],
          },
        },
        description: 'Número máximo de opções que podem ser selecionadas',
      },

      // Send Link Fields
      {
        displayName: 'Link URL',
        name: 'linkUrl',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendLink'],
          },
        },
        description: 'URL do link',
      },
      {
        displayName: 'Link Message',
        name: 'linkMessage',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendLink'],
          },
        },
        description: 'Mensagem do link',
      },
      {
        displayName: 'Title',
        name: 'title',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendLink'],
          },
        },
        description: 'Título do link',
      },
      {
        displayName: 'Link Description',
        name: 'linkDescription',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendLink'],
          },
        },
        description: 'Descrição do link',
      },

      // Delete Message Fields
      {
        displayName: 'Message ID',
        name: 'messageId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['deleteMessage'],
          },
        },
        description: 'ID da mensagem a ser deletada',
      },

      // =====================================
      // GROUP OPERATIONS
      // =====================================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['group'],
          },
        },
        options: [
          {
            name: 'Create Group',
            value: 'createGroup',
            description: 'Criar novo grupo',
            action: 'Create group',
          },
          {
            name: 'List Groups',
            value: 'listGroups',
            description: 'Listar todos os grupos',
            action: 'List groups',
          },
          {
            name: 'Get Metadata',
            value: 'getMetadata',
            description: 'Obter informações do grupo',
            action: 'Get metadata',
          },
          {
            name: 'Add Participant',
            value: 'addParticipant',
            description: 'Adicionar participante',
            action: 'Add participant',
          },
          {
            name: 'Remove Participant',
            value: 'removeParticipant',
            description: 'Remover participante',
            action: 'Remove participant',
          },
          {
            name: 'Promote to Admin',
            value: 'addAdmin',
            description: 'Promover a administrador',
            action: 'Promote to admin',
          },
          {
            name: 'Demote Admin',
            value: 'removeAdmin',
            description: 'Remover administrador',
            action: 'Demote admin',
          },
          {
            name: 'Leave Group',
            value: 'leaveGroup',
            description: 'Sair do grupo',
            action: 'Leave group',
          },
          {
            name: 'Update Name',
            value: 'updateName',
            description: 'Atualizar nome do grupo',
            action: 'Update name',
          },
          {
            name: 'Update Description',
            value: 'updateDescription',
            description: 'Atualizar descrição do grupo',
            action: 'Update description',
          },
        ],
        default: 'listGroups',
      },

      // Group ID Field
      {
        displayName: 'Group ID',
        name: 'groupId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['group'],
            operation: [
              'getMetadata',
              'addParticipant',
              'removeParticipant',
              'addAdmin',
              'removeAdmin',
              'leaveGroup',
              'updateName',
              'updateDescription',
            ],
          },
        },
        description: 'ID do grupo (ex: 5511999999999-1234567890@g.us)',
      },

      // Create Group Fields
      {
        displayName: 'Group Name',
        name: 'groupName',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['group'],
            operation: ['createGroup', 'updateName'],
          },
        },
        description: 'Nome do grupo',
      },
      {
        displayName: 'Participants',
        name: 'phones',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['group'],
            operation: ['createGroup', 'addParticipant', 'removeParticipant', 'addAdmin', 'removeAdmin'],
          },
        },
        description: 'Números de telefone separados por vírgula (ex: 5511999999999,5511888888888)',
      },

      // Update Description Field
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        typeOptions: {
          rows: 3,
        },
        default: '',
        displayOptions: {
          show: {
            resource: ['group'],
            operation: ['updateDescription'],
          },
        },
        description: 'Descrição do grupo',
      },

      // =====================================
      // WEBHOOK OPERATIONS
      // =====================================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['webhook'],
          },
        },
        options: [
          {
            name: 'Set Webhook',
            value: 'setWebhook',
            description: 'Configurar webhook',
            action: 'Set webhook',
          },
          {
            name: 'Get Webhook',
            value: 'getWebhook',
            description: 'Obter configuração do webhook',
            action: 'Get webhook',
          },
          {
            name: 'Delete Webhook',
            value: 'deleteWebhook',
            description: 'Remover webhook',
            action: 'Delete webhook',
          },
        ],
        default: 'getWebhook',
      },

      // Webhook URL Field
      {
        displayName: 'Webhook URL',
        name: 'webhookUrl',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['webhook'],
            operation: ['setWebhook'],
          },
        },
        description: 'URL para receber eventos',
      },

      // Check Phones Fields (Instance)
      {
        displayName: 'Phone Numbers',
        name: 'phonesToCheck',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['instance'],
            operation: ['checkPhones'],
          },
        },
        description: 'Números separados por vírgula (ex: 5511999999999,5511888888888)',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: IDataObject[] = [];
    const credentials = await this.getCredentials('waflyApi');

    const baseUrl = credentials.baseUrl as string;
    const instance = credentials.instance as string;
    const token = credentials.token as string;

    for (let i = 0; i < items.length; i++) {
      try {
        const resource = this.getNodeParameter('resource', i) as string;
        const operation = this.getNodeParameter('operation', i) as string;

        let endpoint = '';
        let method = 'GET';
        let body: IDataObject = {};

        // =====================================
        // INSTANCE OPERATIONS
        // =====================================
        if (resource === 'instance') {
          const basePath = `/instances/${instance}/token/${token}`;

          if (operation === 'getQrCode') {
            endpoint = `${basePath}/qr-code`;
            method = 'GET';
          } else if (operation === 'getStatus') {
            endpoint = `${basePath}/status`;
            method = 'GET';
          } else if (operation === 'connect') {
            endpoint = `${basePath}/connect`;
            method = 'POST';
          } else if (operation === 'disconnect') {
            endpoint = `${basePath}/disconnect`;
            method = 'GET';
          } else if (operation === 'restart') {
            endpoint = `${basePath}/restart`;
            method = 'GET';
          } else if (operation === 'getDevice') {
            endpoint = `${basePath}/device`;
            method = 'GET';
          } else if (operation === 'checkPhones') {
            endpoint = `${basePath}/phone-exists-batch`;
            method = 'POST';
            const phonesToCheck = this.getNodeParameter('phonesToCheck', i) as string;
            body = {
              phones: phonesToCheck.split(',').map((p) => p.trim()),
            };
          }
        }

        // =====================================
        // MESSAGE OPERATIONS
        // =====================================
        else if (resource === 'message') {
          const basePath = `/instances/${instance}/token/${token}`;
          const phone = this.getNodeParameter('phone', i) as string;

          if (operation === 'sendText') {
            endpoint = `${basePath}/send-text`;
            method = 'POST';
            const message = this.getNodeParameter('message', i) as string;
            body = { phone, message };
          } else if (operation === 'sendImage') {
            endpoint = `${basePath}/send-image`;
            method = 'POST';
            const image = this.getNodeParameter('image', i) as string;
            const caption = this.getNodeParameter('caption', i, '') as string;
            body = { phone, image, caption };
          } else if (operation === 'sendVideo') {
            endpoint = `${basePath}/send-video`;
            method = 'POST';
            const video = this.getNodeParameter('video', i) as string;
            const caption = this.getNodeParameter('caption', i, '') as string;
            body = { phone, video, caption };
          } else if (operation === 'sendAudio') {
            endpoint = `${basePath}/send-audio`;
            method = 'POST';
            const audio = this.getNodeParameter('audio', i) as string;
            body = { phone, audio };
          } else if (operation === 'sendDocument') {
            endpoint = `${basePath}/send-document/pdf`;
            method = 'POST';
            const document = this.getNodeParameter('document', i) as string;
            const fileName = this.getNodeParameter('fileName', i, '') as string;
            const caption = this.getNodeParameter('caption', i, '') as string;
            body = { phone, document, fileName, caption };
          } else if (operation === 'sendLocation') {
            endpoint = `${basePath}/send-location`;
            method = 'POST';
            const latitude = this.getNodeParameter('latitude', i) as string;
            const longitude = this.getNodeParameter('longitude', i) as string;
            const address = this.getNodeParameter('address', i, '') as string;
            body = { phone, latitude, longitude, address };
          } else if (operation === 'sendContact') {
            endpoint = `${basePath}/send-contact`;
            method = 'POST';
            const contactName = this.getNodeParameter('contactName', i) as string;
            const contactPhone = this.getNodeParameter('contactPhone', i) as string;
            body = { phone, contactName, contactPhone };
          } else if (operation === 'sendPoll') {
            endpoint = `${basePath}/send-poll`;
            method = 'POST';
            const message = this.getNodeParameter('pollMessage', i) as string;
            const pollOptions = this.getNodeParameter('pollOptions', i) as string;
            const pollMaxOptions = this.getNodeParameter('pollMaxOptions', i) as number;
            const poll = pollOptions.split(',').map((opt) => ({ optionName: opt.trim() }));
            body = { phone, message, poll, pollMaxOptions };
          } else if (operation === 'sendLink') {
            endpoint = `${basePath}/send-link`;
            method = 'POST';
            const linkUrl = this.getNodeParameter('linkUrl', i) as string;
            const message = this.getNodeParameter('linkMessage', i, '') as string;
            const title = this.getNodeParameter('title', i, '') as string;
            const linkDescription = this.getNodeParameter('linkDescription', i, '') as string;
            body = { phone, linkUrl, message, title, linkDescription };
          } else if (operation === 'deleteMessage') {
            endpoint = `${basePath}/delete-message`;
            method = 'DELETE';
            const messageId = this.getNodeParameter('messageId', i) as string;
            body = { phone, messageId };
          }
        }

        // =====================================
        // GROUP OPERATIONS
        // =====================================
        else if (resource === 'group') {
          const basePath = `/instances/${instance}/token/${token}`;

          if (operation === 'createGroup') {
            endpoint = `${basePath}/create-group`;
            method = 'POST';
            const groupName = this.getNodeParameter('groupName', i) as string;
            const phones = this.getNodeParameter('phones', i) as string;
            body = {
              groupName,
              phones: phones.split(',').map((p) => p.trim()),
            };
          } else if (operation === 'listGroups') {
            endpoint = `${basePath}/groups`;
            method = 'GET';
          } else if (operation === 'getMetadata') {
            endpoint = `${basePath}/group-metadata/${this.getNodeParameter('groupId', i)}`;
            method = 'GET';
          } else if (operation === 'addParticipant') {
            endpoint = `${basePath}/add-participant`;
            method = 'POST';
            const groupId = this.getNodeParameter('groupId', i) as string;
            const phones = this.getNodeParameter('phones', i) as string;
            body = {
              groupId,
              phones: phones.split(',').map((p) => p.trim()),
            };
          } else if (operation === 'removeParticipant') {
            endpoint = `${basePath}/remove-participant`;
            method = 'POST';
            const groupId = this.getNodeParameter('groupId', i) as string;
            const phones = this.getNodeParameter('phones', i) as string;
            body = {
              groupId,
              phones: phones.split(',').map((p) => p.trim()),
            };
          } else if (operation === 'addAdmin') {
            endpoint = `${basePath}/add-admin`;
            method = 'POST';
            const groupId = this.getNodeParameter('groupId', i) as string;
            const phones = this.getNodeParameter('phones', i) as string;
            body = {
              groupId,
              phones: phones.split(',').map((p) => p.trim()),
            };
          } else if (operation === 'removeAdmin') {
            endpoint = `${basePath}/remove-admin`;
            method = 'POST';
            const groupId = this.getNodeParameter('groupId', i) as string;
            const phones = this.getNodeParameter('phones', i) as string;
            body = {
              groupId,
              phones: phones.split(',').map((p) => p.trim()),
            };
          } else if (operation === 'leaveGroup') {
            endpoint = `${basePath}/leave-group`;
            method = 'POST';
            const groupId = this.getNodeParameter('groupId', i) as string;
            body = { groupId };
          } else if (operation === 'updateName') {
            endpoint = `${basePath}/update-group-name`;
            method = 'POST';
            const groupId = this.getNodeParameter('groupId', i) as string;
            const groupName = this.getNodeParameter('groupName', i) as string;
            body = { groupId, groupName };
          } else if (operation === 'updateDescription') {
            endpoint = `${basePath}/update-group-description`;
            method = 'POST';
            const groupId = this.getNodeParameter('groupId', i) as string;
            const description = this.getNodeParameter('description', i) as string;
            body = { groupId, description };
          }
        }

        // =====================================
        // WEBHOOK OPERATIONS
        // =====================================
        else if (resource === 'webhook') {
          const basePath = `/instances/${instance}/token/${token}`;

          if (operation === 'setWebhook') {
            endpoint = `${basePath}/webhook`;
            method = 'POST';
            const webhookUrl = this.getNodeParameter('webhookUrl', i) as string;
            body = { webhookUrl };
          } else if (operation === 'getWebhook') {
            endpoint = `${basePath}/webhook`;
            method = 'GET';
          } else if (operation === 'deleteWebhook') {
            endpoint = `${basePath}/webhook`;
            method = 'DELETE';
          }
        }

        // Make the API request
        const options = {
          method,
          url: `${baseUrl}${endpoint}`,
          headers: {
            'Client-Token': credentials.clientToken,
            'Content-Type': 'application/json',
          },
          body: Object.keys(body).length > 0 ? body : undefined,
          json: true,
        };

        const responseData = await this.helpers.request(options);
        returnData.push(responseData as IDataObject);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ error: (error as Error).message });
          continue;
        }
        throw new NodeOperationError(this.getNode(), error as Error);
      }
    }

    return [this.helpers.returnJsonArray(returnData)];
  }
}
