import * as grpcClient from '@restorecommerce/grpc-client';
import { cfg } from './config';

interface Microservices {
  conf: any;
  logger: any;
  microservice: {
    service: { [key: string]: any };
    mapClients: Map<string, string>;
  };
}

/**
 * Used to help 'build' part of the facade structure
 */
export class Builder {
  resourcesConfig: any;

  constructor() { }
  async setupServices(resourcesConfig: Microservices): Promise<any> {
    this.resourcesConfig = resourcesConfig;
    this.resourcesConfig.microservice = {
      service: {},
      mapClients: new Map<String, String>()
    };

    const resources = cfg.get('resources');
    const clientConfig = cfg.get('client');

    for (let resourceType in resources) {
      const resourceCfg = resources[resourceType];
      const resourcePrefix = resourceCfg.resourcePrefix;
      const servicePrefix = resourceCfg.servicePrefix;

      for (let service in resourceCfg.resources) {
        const serviceCfg = resourceCfg.resources[service];
        for (let resource of serviceCfg) {
          const protos = [`${resourcePrefix}/${resource}.proto`];
          const serviceName = `${servicePrefix}.${resource}.Service`;
          const defaultConfig = clientConfig[resource];
          defaultConfig.transports.grpc.protos = protos;
          defaultConfig.transports.grpc.service = serviceName;

          try {
            const client = new grpcClient.Client(defaultConfig, this.resourcesConfig.logger);
            this.resourcesConfig.microservice.service[serviceName] = await client.connect();
            this.resourcesConfig.microservice.mapClients.set(resource, serviceName);
            this.resourcesConfig.logger.verbose('connected to microservice: ' + serviceName);
          } catch (err) {
            this.resourcesConfig.logger.error('microservice connecting to service',
              serviceName, err);
          }
        }
      }
    }
  }

  getMicroservices(): Microservices {
    return this.resourcesConfig;
  }

}

export const builder = new Builder();
