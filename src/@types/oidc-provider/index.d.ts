declare module "oidc-provider" {
    export default class Provider {
        public app: any;

        public OIDCContext: any;

        public Account: any;

        public IdToken: any;

        public Client: any;

        public AccessToken: any;

        public AuthorizationCode: any;

        public RefreshToken: any;

        public DeviceCode: any;

        constructor(...args: any[]);

        public interactionDetails(...args: any[]): any;

        public interactionFinished(...args: any[]): any;

        public registerGrantType(...args: any[]): void;


    }

    export namespace errors {
        class InvalidGrant {
            constructor(...args: any[]);
        }
    }

    export namespace interactionPolicy {
        function base(...args: any[]): any;
    }
}
