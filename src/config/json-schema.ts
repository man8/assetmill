import Ajv, { ErrorObject } from 'ajv';

const ajv = new Ajv({ allErrors: true, verbose: true });

export const pipelineConfigSchema = {
  type: 'object',
  required: ['source', 'output', 'assets'],
  properties: {
    source: {
      type: 'object',
      required: ['images'],
      properties: {
        images: {
          type: 'array',
          minItems: 1,
          items: { type: 'string', minLength: 1 }
        },
        formats: {
          type: 'array',
          minItems: 1,
          items: { enum: ['svg', 'png', 'jpeg', 'jpg'] }
        },
        validation: {
          type: 'object',
          properties: {
            minWidth: { type: 'number', minimum: 1 },
            minHeight: { type: 'number', minimum: 1 },
            maxFileSize: { type: 'number', minimum: 1 },
            requireTransparency: { type: 'boolean' }
          },
          additionalProperties: true
        },
        defaults: {
          type: 'object',
          properties: {
            favicon: { type: 'boolean' },
            social: { type: 'boolean' },
            logos: { type: 'boolean' },
            platforms: { type: 'boolean' }
          },
          additionalProperties: true
        }
      },
      additionalProperties: true
    },
    output: {
      type: 'object',
      required: ['directory'],
      properties: {
        directory: { type: 'string', minLength: 1 },
        structure: {
          type: 'object',
          properties: {
            favicon: { type: 'string' },
            social: { type: 'string' },
            logos: { type: 'string' },
            platforms: { type: 'string' }
          },
          additionalProperties: true
        },
        naming: {
          type: 'object',
          properties: {
            template: { type: 'string', minLength: 1 },
            variables: { type: 'object' }
          },
          additionalProperties: true
        },
        formats: {
          type: 'array',
          items: { enum: ['png', 'jpeg', 'webp', 'avif', 'ico', 'svg'] }
        },
        overwrite: { enum: ['allow', 'warn', 'error'] }
      },
      additionalProperties: true
    },
    assets: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['name', 'variants'],
        properties: {
          name: { type: 'string', minLength: 1 },
          type: { enum: ['favicon', 'social', 'logo', 'platform-specific'] },
          outputPath: { type: 'string' },
          source: { type: 'string' },
          variants: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', minLength: 1 },
                format: { enum: ['png', 'jpeg', 'webp', 'avif', 'ico', 'svg'] },
                width: { type: 'number', minimum: 1 },
                height: { type: 'number', minimum: 1 },
                quality: { type: 'number', minimum: 1, maximum: 100 },
                margin: { type: 'object' },
                theme: { enum: ['light', 'dark', 'monochrome', 'high-contrast'] },
                background: { type: 'string' },
                monochrome: { 
                  oneOf: [
                    { type: 'string' },
                    { type: 'object' }
                  ]
                },
                simplified: { type: 'boolean' },
                viewBox: { type: 'string' },
                preserveAspectRatio: { type: 'string' },
                colorTransforms: { type: 'array' },
                sizes: { 
                  type: 'array',
                  items: { type: 'number', minimum: 1 }
                },
                svg: { type: 'object' },
                overwrite: { enum: ['allow', 'warn', 'error'] }
              },
              additionalProperties: true
            }
          }
        },
        additionalProperties: true
      }
    },
    processing: {
      type: 'object',
      properties: {
        quality: {
          type: 'object',
          properties: {
            png: { type: 'number', minimum: 1, maximum: 100 },
            jpeg: { type: 'number', minimum: 1, maximum: 100 },
            webp: { type: 'number', minimum: 1, maximum: 100 },
            avif: { type: 'number', minimum: 1, maximum: 100 },
            svg: { type: 'number', minimum: 1, maximum: 100 }
          },
          additionalProperties: true
        },
        optimisation: {
          type: 'object',
          properties: {
            progressive: { type: 'boolean' },
            optimise: { type: 'boolean' },
            lossless: { type: 'boolean' }
          },
          additionalProperties: true
        },
        themes: {
          type: 'object',
          properties: {
            light: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                colorTransforms: { type: 'array' },
                color: { type: 'string' },
                threshold: { type: 'number' },
                background: { type: 'string' }
              },
              additionalProperties: true
            },
            dark: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                colorTransforms: { type: 'array' },
                color: { type: 'string' },
                threshold: { type: 'number' },
                background: { type: 'string' }
              },
              additionalProperties: true
            },
            monochrome: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                colorTransforms: { type: 'array' },
                color: { type: 'string' },
                threshold: { type: 'number' },
                background: { type: 'string' }
              },
              additionalProperties: true
            }
          },
          additionalProperties: true
        },
        contrast: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            threshold: { type: 'number' },
            strokeWidth: { type: 'number' },
            strokeColor: { type: 'string' }
          },
          additionalProperties: true
        }
      },
      additionalProperties: true
    },
    platforms: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { enum: ['google-workspace', 'slack', 'discord', 'github', 'twitter', 'linkedin', 'facebook'] },
          assets: { type: 'array' },
          requirements: { type: 'object' }
        },
        additionalProperties: true
      }
    }
  },
  additionalProperties: true
};

export const validateConfigSchema = ajv.compile(pipelineConfigSchema);

export function formatSchemaErrors(errors: ErrorObject[]): string[] {
  return errors.map(error => {
    const path = error.instancePath ? error.instancePath.replace(/\//g, '.').substring(1) : 'root';
    const message = error.message || 'validation failed';
    
    if (error.keyword === 'required') {
      const missingProperty = error.params?.missingProperty;
      return `Configuration error at '${path}': missing required property '${missingProperty}'`;
    } else if (error.keyword === 'enum') {
      const allowedValues = error.params?.allowedValues?.join(', ');
      return `Configuration error at '${path}': must be one of [${allowedValues}]`;
    } else if (error.keyword === 'minItems') {
      return `Configuration error at '${path}': must contain at least ${error.params?.limit} items`;
    } else if (error.keyword === 'minimum') {
      return `Configuration error at '${path}': must be greater than or equal to ${error.params?.limit}`;
    } else if (error.keyword === 'maximum') {
      return `Configuration error at '${path}': must be less than or equal to ${error.params?.limit}`;
    } else if (error.keyword === 'minLength') {
      return `Configuration error at '${path}': must not be empty`;
    }
    
    return `Configuration error at '${path}': ${message}`;
  });
}
