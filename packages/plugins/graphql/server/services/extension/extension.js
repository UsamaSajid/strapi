'use strict';

const nexus = require('nexus');
const { merge } = require('lodash/fp');

/**
 * @typedef StrapiGraphQLExtensionConfiguration
 * @property {NexusGen[]} types - A collection of Nexus types
 * @property {string} typeDefs - Type definitions (SDL format)
 * @property {object} resolvers - A resolver map
 * @property {object} resolversConfig - An object that bind a configuration to a resolver based on an absolute path (the key)
 * @property {NexusPlugin[]} plugins - A collection of Nexus plugins
 */

/**
 * @typedef {function({ strapi: object, nexus: object, typeRegistry: object }): StrapiGraphQLExtensionConfiguration} StrapiGraphQLExtensionConfigurationFactory
 */

const defaultState = {
  types: [],
  typeDefs: [],
  resolvers: {},
  resolversConfig: {},
  plugins: [],
};

const createExtension = ({ strapi } = {}) => {
  const configs = [];

  return {
    /**
     * Register a new extension configuration
     * @param {StrapiGraphQLExtensionConfiguration | StrapiGraphQLExtensionConfigurationFactory} configuration
     * @return {this}
     */
    use(configuration) {
      configs.push(configuration);

      return this;
    },

    /**
     * Convert the registered configuration into a single extension object & return it
     * @param {object} options
     * @param {object} options.typeRegistry
     * @return {object}
     */
    generate({ typeRegistry }) {
      const resolveConfig = config => {
        return typeof config === 'function' ? config({ strapi, nexus, typeRegistry }) : config;
      };

      // Evaluate & merge every registered configuration object, then return the result
      return configs.reduce((acc, configuration) => {
        const { types, typeDefs, resolvers, resolversConfig, plugins } = resolveConfig(
          configuration
        );

        // Register type definitions
        if (typeof typeDefs === 'string') {
          acc.typeDefs.push(typeDefs);
        }

        // Register nexus types
        if (Array.isArray(types)) {
          acc.types.push(...types);
        }

        // Register nexus plugins
        if (Array.isArray(plugins)) {
          acc.plugins.push(...plugins);
        }

        // Register resolvers
        if (typeof resolvers === 'object') {
          acc.resolvers = merge(acc.resolvers, resolvers);
        }

        // Register resolvers configuration
        if (typeof resolversConfig === 'object') {
          acc.resolversConfig = merge(acc.resolversConfig, resolversConfig);
        }

        return acc;
      }, defaultState);
    },
  };
};

module.exports = createExtension;
