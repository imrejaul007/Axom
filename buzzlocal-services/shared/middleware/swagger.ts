/**
 * Swagger/OpenAPI Documentation for BuzzLocal Services
 */

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'BuzzLocal API',
    version: '1.0.0',
    description: 'BuzzLocal - Life OS for local communities',
    contact: {
      name: 'BuzzLocal Team',
      email: 'api@buzzlocal.app'
    }
  },
  servers: [
    {
      url: 'http://localhost:4019',
      description: 'Development'
    },
    {
      url: 'https://api.buzzlocal.app',
      description: 'Production'
    }
  ],
  tags: [
    { name: 'SocietyOS', description: 'Visitor management, QR passes, announcements' },
    { name: 'HousingOS', description: 'Property listings, search, flatmates' },
    { name: 'PropertyOS', description: 'Landlord dashboard, tenants, rent collection' },
    { name: 'RentFinanceOS', description: 'Zero deposit, credit score' },
    { name: 'SafetyOS', description: 'Alerts, SOS, area safety' }
  ],
  paths: {
    // SocietyOS
    '/api/societies': {
      get: {
        tags: ['SocietyOS'],
        summary: 'List societies',
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string' } },
          { name: 'area', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'List of societies' }
        }
      },
      post: {
        tags: ['SocietyOS'],
        summary: 'Create society',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Society' }
            }
          }
        },
        responses: {
          '201': { description: 'Society created' }
        }
      }
    },
    '/api/societies/{id}/visitors': {
      get: {
        tags: ['SocietyOS'],
        summary: 'List visitors',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'List of visitors' }
        }
      },
      post: {
        tags: ['SocietyOS'],
        summary: 'Add visitor',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Visitor' }
            }
          }
        },
        responses: {
          '201': { description: 'Visitor added' }
        }
      }
    },
    '/api/societies/{id}/visitors/{visitorId}/generate-qr': {
      post: {
        tags: ['SocietyOS'],
        summary: 'Generate QR pass',
        description: 'Generate QR pass for approved visitor',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'visitorId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'QR pass generated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/QrPass' }
              }
            }
          }
        }
      }
    },
    '/api/societies/{id}/visitors/verify-qr': {
      post: {
        tags: ['SocietyOS'],
        summary: 'Verify QR pass',
        description: 'Guard scans QR code to verify visitor',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  qrToken: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Verification result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    verified: { type: 'boolean' },
                    visitor: { $ref: '#/components/schemas/VisitorDetail' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    // HousingOS
    '/api/housing/properties': {
      get: {
        tags: ['HousingOS'],
        summary: 'Search properties',
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['rental', 'pg', 'coliving'] } },
          { name: 'area', in: 'query', schema: { type: 'string' } },
          { name: 'minRent', in: 'query', schema: { type: 'number' } },
          { name: 'maxRent', in: 'query', schema: { type: 'number' } },
          { name: 'bedrooms', in: 'query', schema: { type: 'number' } }
        ],
        responses: { '200': { description: 'Properties found' } }
      },
      post: {
        tags: ['HousingOS'],
        summary: 'Create property listing',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Property' }
            }
          }
        },
        responses: { '201': { description: 'Property created' } }
      }
    },
    // RentFinanceOS
    '/api/rentfinance/credit-score': {
      get: {
        tags: ['RentFinanceOS'],
        summary: 'Get rent credit score',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Credit score details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    score: { type: 'number' },
                    level: { type: 'string', enum: ['bronze', 'silver', 'gold', 'platinum'] },
                    limit: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/rentfinance/check-eligibility': {
      post: {
        tags: ['RentFinanceOS'],
        summary: 'Check zero deposit eligibility',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  depositAmount: { type: 'number' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Eligibility result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    eligible: { type: 'boolean' },
                    userScore: { type: 'number' },
                    trustLevel: { type: 'string' },
                    creditLimit: { type: 'number' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Society: {
        type: 'object',
        required: ['name', 'type', 'address', 'location'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['apartment', 'gated', 'layout', 'campus', 'society'] },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              area: { type: 'string' },
              city: { type: 'string' },
              pincode: { type: 'string' }
            }
          },
          location: {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' }
            }
          }
        }
      },
      Visitor: {
        type: 'object',
        required: ['visitorName', 'purpose', 'expectedDate', 'flatNumber'],
        properties: {
          visitorName: { type: 'string' },
          visitorPhone: { type: 'string' },
          purpose: { type: 'string', enum: ['family', 'friend', 'delivery', 'service', 'other'] },
          expectedDate: { type: 'string', format: 'date' },
          expectedTime: { type: 'string' },
          flatNumber: { type: 'string' },
          notes: { type: 'string' }
        }
      },
      QrPass: {
        type: 'object',
        properties: {
          qrCode: { type: 'string', description: 'Base64 PNG image' },
          qrToken: { type: 'string' },
          validUntil: { type: 'string', format: 'date-time' },
          visitorName: { type: 'string' },
          flatNumber: { type: 'string' },
          purpose: { type: 'string' }
        }
      },
      Property: {
        type: 'object',
        required: ['type', 'title', 'address', 'location', 'monthlyRent', 'securityDeposit', 'availableFrom'],
        properties: {
          type: { type: 'string', enum: ['rental', 'pg', 'coliving', 'apartment'] },
          title: { type: 'string' },
          description: { type: 'string' },
          address: { $ref: '#/components/schemas/Society/properties/address' },
          location: { $ref: '#/components/schemas/Society/properties/location' },
          monthlyRent: { type: 'number' },
          securityDeposit: { type: 'number' },
          bedrooms: { type: 'number' },
          bathrooms: { type: 'number' },
          furnished: { type: 'string', enum: ['full', 'semi', 'unfurnished'] },
          availableFrom: { type: 'string', format: 'date' }
        }
      }
    }
  }
};
