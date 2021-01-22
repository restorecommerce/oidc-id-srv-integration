import { builder } from './builder';
import { errors } from './config';

export class EndpointHandler {
  resourceName: any;

  constructor(resourceName?: any) {
    this.resourceName = resourceName;
  }

  getResourceService() {
    // List of services for resources available
    const options = builder.getMicroservices();
    const mapValue = options.microservice.mapClients.get(this.resourceName);
    let resourceService;
    if (mapValue) {
      resourceService = options.microservice.service[mapValue];
    }
    if (!resourceService) {
      resourceService = options.microservice.service[this.resourceName];
    }
    return resourceService;
  }

  parseError(error: any, output: any): void {
    if (error) {
      if (error.name && error.name.includes('Unavailable')) {
        output.error.code.push(errors.UNAVAILABLE.code);
        output.error.message.push(errors.UNAVAILABLE.message);
      } else if ((error.details && error.details.includes('invalid argument')) ||
        (error.message && error.message.includes('invalid argument'))) {
        output.error.code.push(errors.INVALID_ARGUMENT.code);
        output.error.message.push(error.details);
      } else if ((error.details && error.details.includes('already exists')) ||
        (error.message && error.message.includes('already exists'))) {
        output.error.code.push(errors.DATA_ALREADY_EXIST.code);
        output.error.message.push(error.details);
      } else if (error.details && error.details.includes('not found') ||
        (error.message && error.message.includes('not found'))) {
        output.error.code.push(errors.DATA_NOT_FOUND.code);
        output.error.message.push(error.details);
      } else {  // default
        output.error.code.push(errors.SYSTEM_ERROR.code);
        output.error.message.push(errors.SYSTEM_ERROR.message);
      }
    }
  }
}
