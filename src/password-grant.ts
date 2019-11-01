import Koa from "koa";
import {
    TokenResponseBody,
    InvalidPasswordGrant,
    PerformPasswordGrantFunc,
    OIDCPasswordGrantTypeConfig,
    Claims,
    Account,
} from "./interfaces";
import { epochTime, nanoid } from "./utils";

function registerPasswordGrantType(config: OIDCPasswordGrantTypeConfig): PerformPasswordGrantFunc {

    const { provider, authenticate } = config;

    const performPasswordGrant = async (
        ctx: Koa.Context,
        clientId: string,
        identifier: string,
        password: string,
    ): Promise<TokenResponseBody> => {
        const client = await ctx.oidc.provider.Client.find(clientId);

        let account: Account | undefined;
        try {
            account = await authenticate(identifier, password);
        } catch (err) {
            throw new InvalidPasswordGrant("invalid credentials provided");
        }

        if (!account) {
            throw new InvalidPasswordGrant("invalid credentials provided");
        }

        const expiresIn = 86400;  // todo, remove hardcoded

        const { AccessToken } = ctx.oidc.provider;
        const at = new AccessToken({
            gty: "password",
            scope: "openid",
            accountId: account.accountId,
            claims: { rejected: [] },
            client,
            grantId: ctx.oidc.uid,
            expiresWithSession: false,
            expiresIn,
        });
        ctx.oidc.entity("AccessToken", at);
        const accessToken = await at.save();

        const claims = await account.claims("id_token", "openid");

        const idToken = await generateIdToken(ctx, clientId, expiresIn, claims);

        return {
            access_token: accessToken,
            id_token: idToken,
            expires_at: epochTime() + at.expiration,
            token_type: at.tokenType,
            scope: "openid",
        };
    };

    async function generateIdToken(
        ctx: Koa.Context,
        clientId: string,
        expiresIn: number,
        claims: Claims,
    ): Promise<string> {
        const client = await ctx.oidc.provider.Client.find(clientId);
        ctx.oidc.entity("Client", client);
        const { IdToken } = ctx.oidc.provider;
        const jti = nanoid();
        const exp = epochTime() + expiresIn;
        const token = new IdToken({
            ...claims,
        }, { ctx });

        token.set("jti", jti);
        token.scope = "openid profile";
        return await token.issue({expiresAt: exp});
    }

    provider.registerGrantType(
        "password",
        async (ctx: Koa.Context, next: () => Promise<any>) => {
            try {
                const { params, client } = ctx.oidc;
                ctx.type = "json";
                ctx.body = await performPasswordGrant(ctx, client.clientId, params.identifier, params.password);
            } catch (ex) {
                if (ex instanceof InvalidPasswordGrant) {
                    ctx.status = 401;
                    ctx.type = "json";
                    ctx.body = {
                        error: ex.error,
                        error_description: ex.error_description,
                    };
                } else {
                    ctx.status = 400;
                    ctx.body = {
                        error: "bad_request",
                        error_description: "Bad request",
                    };
                }
            }
            await next();
        },
        ["username", "password"],
        [],
    );

    return performPasswordGrant;
}

export { registerPasswordGrantType };
