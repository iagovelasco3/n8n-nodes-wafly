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
    icon: 'file:wafly.png',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with the Wafly WhatsApp Bridge API',
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
            description: 'Get the QR Code to connect the instance',
            action: 'Get QR code',
          },
          {
            name: 'Get Status',
            value: 'getStatus',
            description: 'Check the connection status',
            action: 'Get status',
          },
          {
            name: 'Connect',
            value: 'connect',
            description: 'Connect the instance',
            action: 'Connect instance',
          },
          {
            name: 'Disconnect',
            value: 'disconnect',
            description: 'Disconnect the instance',
            action: 'Disconnect instance',
          },
          {
            name: 'Restart',
            value: 'restart',
            description: 'Restart the instance',
            action: 'Restart instance',
          },
          {
            name: 'Get Device Info',
            value: 'getDevice',
            description: 'Get device information',
            action: 'Get device info',
          },
          {
            name: 'Check Phone Numbers',
            value: 'checkPhones',
            description: 'Check whether phone numbers exist on WhatsApp',
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
            description: 'Send a text message',
            action: 'Send text message',
          },
          {
            name: 'Send Image',
            value: 'sendImage',
            description: 'Send an image',
            action: 'Send image',
          },
          {
            name: 'Send Video',
            value: 'sendVideo',
            description: 'Send a video',
            action: 'Send video',
          },
          {
            name: 'Send Audio',
            value: 'sendAudio',
            description: 'Send an audio file',
            action: 'Send audio',
          },
          {
            name: 'Send Document',
            value: 'sendDocument',
            description: 'Send a document',
            action: 'Send document',
          },
          {
            name: 'Send Location',
            value: 'sendLocation',
            description: 'Send a location',
            action: 'Send location',
          },
          {
            name: 'Send Contact',
            value: 'sendContact',
            description: 'Send a contact card',
            action: 'Send contact',
          },
          {
            name: 'Send Poll',
            value: 'sendPoll',
            description: 'Send a poll',
            action: 'Send poll',
          },
          {
            name: 'Send Link',
            value: 'sendLink',
            description: 'Send a link with preview',
            action: 'Send link',
          },
          {
            name: 'Delete Message',
            value: 'deleteMessage',
            description: 'Delete a message',
            action: 'Delete message',
          },
        ],
        default: 'sendText',
      },

      // Phone Number Field (shared by several operations)
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
        description: 'Phone number including country code (e.g. 5511999999999)',
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
        description: 'Text of the message',
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
        description: 'URL of the image',
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
        description: 'Caption for the media',
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
        description: 'URL of the video',
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
        description: 'URL of the audio file',
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
        description: 'URL of the document',
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
        description: 'Name of the file',
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
        description: 'Latitude of the location',
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
        description: 'Longitude of the location',
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
        description: 'Address of the location',
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
        description: 'Name of the contact',
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
        description: 'Phone number of the contact',
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
        description: 'Question of the poll',
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
        description: 'Comma-separated poll options (e.g. Blue,Green,Red)',
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
        description: 'Maximum number of options that can be selected',
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
        description: 'URL of the link',
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
        description: 'Message sent along with the link',
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
        description: 'Title of the link preview',
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
        description: 'Description of the link preview',
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
        description: 'ID of the message to delete',
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
            description: 'Create a new group',
            action: 'Create group',
          },
          {
            name: 'List Groups',
            value: 'listGroups',
            description: 'List all groups',
            action: 'List groups',
          },
          {
            name: 'Get Metadata',
            value: 'getMetadata',
            description: 'Get group information',
            action: 'Get metadata',
          },
          {
            name: 'Add Participant',
            value: 'addParticipant',
            description: 'Add a participant to the group',
            action: 'Add participant',
          },
          {
            name: 'Remove Participant',
            value: 'removeParticipant',
            description: 'Remove a participant from the group',
            action: 'Remove participant',
          },
          {
            name: 'Promote to Admin',
            value: 'addAdmin',
            description: 'Promote a participant to admin',
            action: 'Promote to admin',
          },
          {
            name: 'Demote Admin',
            value: 'removeAdmin',
            description: 'Demote an admin',
            action: 'Demote admin',
          },
          {
            name: 'Leave Group',
            value: 'leaveGroup',
            description: 'Leave the group',
            action: 'Leave group',
          },
          {
            name: 'Update Name',
            value: 'updateName',
            description: 'Update the group name',
            action: 'Update name',
          },
          {
            name: 'Update Description',
            value: 'updateDescription',
            description: 'Update the group description',
            action: 'Update description',
          },
          {
            name: 'Update Photo',
            value: 'updatePhoto',
            description: 'Update the group photo',
            action: 'Update photo',
          },
          {
            name: 'Approve Participant',
            value: 'approveParticipant',
            description: 'Approve a pending participant',
            action: 'Approve participant',
          },
          {
            name: 'Reject Participant',
            value: 'rejectParticipant',
            description: 'Reject a pending participant',
            action: 'Reject participant',
          },
          {
            name: 'Get Invite Link',
            value: 'getInviteLink',
            description: 'Get the group invite link',
            action: 'Get invite link',
          },
          {
            name: 'Redefine Invite Link',
            value: 'redefineInviteLink',
            description: 'Reset the group invite link',
            action: 'Redefine invite link',
          },
          {
            name: 'Update Settings',
            value: 'updateSettings',
            description: 'Update the group settings',
            action: 'Update settings',
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
              'updatePhoto',
              'approveParticipant',
              'rejectParticipant',
              'getInviteLink',
              'redefineInviteLink',
              'updateSettings',
            ],
          },
        },
        description: 'Group ID (e.g. 5511999999999-1234567890@g.us)',
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
        description: 'Name of the group',
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
            operation: [
              'createGroup',
              'addParticipant',
              'removeParticipant',
              'addAdmin',
              'removeAdmin',
              'approveParticipant',
              'rejectParticipant',
            ],
          },
        },
        description: 'Comma-separated phone numbers (e.g. 5511999999999,5511888888888)',
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
        description: 'Description of the group',
      },

      {
        displayName: 'Group Photo URL',
        name: 'groupPhoto',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['group'],
            operation: ['updatePhoto'],
          },
        },
        description: 'URL of the image to use as the group photo',
      },

      {
        displayName: 'Page',
        name: 'page',
        type: 'number',
        default: 0,
        displayOptions: {
          show: {
            resource: ['group'],
            operation: ['listGroups'],
          },
        },
        description: 'Page number (optional)',
      },
      {
        displayName: 'Page Size',
        name: 'pageSize',
        type: 'number',
        default: 0,
        displayOptions: {
          show: {
            resource: ['group'],
            operation: ['listGroups'],
          },
        },
        description: 'Number of groups per page (optional)',
      },

      {
        displayName: 'Admin Only Message',
        name: 'adminOnlyMessage',
        type: 'options',
        options: [
          { name: 'Do Not Change', value: '' },
          { name: 'Yes', value: 'true' },
          { name: 'No', value: 'false' },
        ],
        default: '',
        displayOptions: {
          show: {
            resource: ['group'],
            operation: ['updateSettings'],
          },
        },
        description: 'Whether only admins can send messages',
      },
      {
        displayName: 'Admin Only Settings',
        name: 'adminOnlySettings',
        type: 'options',
        options: [
          { name: 'Do Not Change', value: '' },
          { name: 'Yes', value: 'true' },
          { name: 'No', value: 'false' },
        ],
        default: '',
        displayOptions: {
          show: {
            resource: ['group'],
            operation: ['updateSettings'],
          },
        },
        description: 'Whether only admins can change the group settings',
      },
      {
        displayName: 'Require Admin Approval',
        name: 'requireAdminApproval',
        type: 'options',
        options: [
          { name: 'Do Not Change', value: '' },
          { name: 'Yes', value: 'true' },
          { name: 'No', value: 'false' },
        ],
        default: '',
        displayOptions: {
          show: {
            resource: ['group'],
            operation: ['updateSettings'],
          },
        },
        description: 'Whether joining the group requires admin approval',
      },
      {
        displayName: 'Admin Only Add Member',
        name: 'adminOnlyAddMember',
        type: 'options',
        options: [
          { name: 'Do Not Change', value: '' },
          { name: 'Yes', value: 'true' },
          { name: 'No', value: 'false' },
        ],
        default: '',
        displayOptions: {
          show: {
            resource: ['group'],
            operation: ['updateSettings'],
          },
        },
        description: 'Whether only admins can add members',
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
            description: 'Set the webhook URL',
            action: 'Set webhook',
          },
          {
            name: 'Get Webhook',
            value: 'getWebhook',
            description: 'Get the webhook configuration',
            action: 'Get webhook',
          },
          {
            name: 'Delete Webhook',
            value: 'deleteWebhook',
            description: 'Delete the webhook',
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
        description: 'URL that will receive the events',
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
        description: 'Comma-separated phone numbers (e.g. 5511999999999,5511888888888)',
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
        let method: 'GET' | 'POST' | 'DELETE' = 'GET';
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
            const page = this.getNodeParameter('page', i, 0) as number;
            const pageSize = this.getNodeParameter('pageSize', i, 0) as number;
            const queryParams: string[] = [];
            if (page > 0) {
              queryParams.push(`page=${page}`);
            }
            if (pageSize > 0) {
              queryParams.push(`pageSize=${pageSize}`);
            }
            if (queryParams.length > 0) {
              endpoint += `?${queryParams.join('&')}`;
            }
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
          } else if (operation === 'updatePhoto') {
            endpoint = `${basePath}/update-group-photo`;
            method = 'POST';
            const groupId = this.getNodeParameter('groupId', i) as string;
            const groupPhoto = this.getNodeParameter('groupPhoto', i) as string;
            body = { groupId, groupPhoto };
          } else if (operation === 'approveParticipant') {
            endpoint = `${basePath}/approve-participant`;
            method = 'POST';
            const groupId = this.getNodeParameter('groupId', i) as string;
            const phones = this.getNodeParameter('phones', i) as string;
            body = {
              groupId,
              phones: phones.split(',').map((p) => p.trim()),
            };
          } else if (operation === 'rejectParticipant') {
            endpoint = `${basePath}/reject-participant`;
            method = 'POST';
            const groupId = this.getNodeParameter('groupId', i) as string;
            const phones = this.getNodeParameter('phones', i) as string;
            body = {
              groupId,
              phones: phones.split(',').map((p) => p.trim()),
            };
          } else if (operation === 'getInviteLink') {
            const groupId = this.getNodeParameter('groupId', i) as string;
            endpoint = `${basePath}/group/invite-link?group_id=${encodeURIComponent(groupId)}`;
            method = 'GET';
          } else if (operation === 'redefineInviteLink') {
            const groupId = this.getNodeParameter('groupId', i) as string;
            endpoint = `${basePath}/redefine-invitation-link/${encodeURIComponent(groupId)}`;
            method = 'POST';
          } else if (operation === 'updateSettings') {
            endpoint = `${basePath}/update-group-settings`;
            method = 'POST';
            const groupId = this.getNodeParameter('groupId', i) as string;
            body = { phone: groupId };
            const adminOnlyMessage = this.getNodeParameter('adminOnlyMessage', i, '') as string;
            const adminOnlySettings = this.getNodeParameter('adminOnlySettings', i, '') as string;
            const requireAdminApproval = this.getNodeParameter('requireAdminApproval', i, '') as string;
            const adminOnlyAddMember = this.getNodeParameter('adminOnlyAddMember', i, '') as string;
            if (adminOnlyMessage !== '') {
              body.adminOnlyMessage = adminOnlyMessage === 'true';
            }
            if (adminOnlySettings !== '') {
              body.adminOnlySettings = adminOnlySettings === 'true';
            }
            if (requireAdminApproval !== '') {
              body.requireAdminApproval = requireAdminApproval === 'true';
            }
            if (adminOnlyAddMember !== '') {
              body.adminOnlyAddMember = adminOnlyAddMember === 'true';
            }
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
        const responseData = await this.helpers.httpRequest({
          method,
          url: `${baseUrl}${endpoint}`,
          headers: {
            'Client-Token': credentials.clientToken as string,
            'Content-Type': 'application/json',
          },
          body: Object.keys(body).length > 0 ? body : undefined,
          json: true,
        });
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
