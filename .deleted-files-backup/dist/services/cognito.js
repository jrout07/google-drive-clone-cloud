"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cognitoService = exports.CognitoService = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class CognitoService {
    constructor() {
        this.userPoolId = config_1.config.aws.cognito.userPoolId || '';
        this.clientId = config_1.config.aws.cognito.clientId || '';
        this.client = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
            region: config_1.config.aws.cognito.region,
            credentials: {
                accessKeyId: config_1.config.aws.accessKeyId || '',
                secretAccessKey: config_1.config.aws.secretAccessKey || '',
            },
        });
    }
    async signUp(request) {
        try {
            const command = new client_cognito_identity_provider_1.AdminCreateUserCommand({
                UserPoolId: this.userPoolId,
                Username: request.username || request.email,
                UserAttributes: [
                    { Name: 'email', Value: request.email },
                    { Name: 'email_verified', Value: 'true' },
                    ...(request.firstName ? [{ Name: 'given_name', Value: request.firstName }] : []),
                    ...(request.lastName ? [{ Name: 'family_name', Value: request.lastName }] : []),
                ],
                TemporaryPassword: request.password,
                MessageAction: client_cognito_identity_provider_1.MessageActionType.SUPPRESS,
            });
            const result = await this.client.send(command);
            await this.setUserPassword(request.username || request.email, request.password);
            return {
                userId: result.User?.Username || '',
                needsConfirmation: false,
            };
        }
        catch (error) {
            logger_1.logger.error('Cognito sign up failed:', error);
            throw new Error('Failed to create user account');
        }
    }
    async signIn(request) {
        try {
            const command = new client_cognito_identity_provider_1.AdminInitiateAuthCommand({
                UserPoolId: this.userPoolId,
                ClientId: this.clientId,
                AuthFlow: client_cognito_identity_provider_1.AuthFlowType.ADMIN_NO_SRP_AUTH,
                AuthParameters: {
                    USERNAME: request.usernameOrEmail,
                    PASSWORD: request.password,
                },
            });
            const result = await this.client.send(command);
            if (result.ChallengeName) {
                throw new Error('Additional authentication challenges not supported yet');
            }
            if (!result.AuthenticationResult) {
                throw new Error('Authentication failed');
            }
            const userData = await this.getUserData(request.usernameOrEmail);
            return {
                accessToken: result.AuthenticationResult.AccessToken,
                refreshToken: result.AuthenticationResult.RefreshToken,
                idToken: result.AuthenticationResult.IdToken,
                user: userData,
            };
        }
        catch (error) {
            logger_1.logger.error('Cognito sign in failed:', error);
            throw new Error('Invalid credentials');
        }
    }
    async getUserData(username) {
        try {
            const command = new client_cognito_identity_provider_1.AdminGetUserCommand({
                UserPoolId: this.userPoolId,
                Username: username,
            });
            const result = await this.client.send(command);
            const attributes = result.UserAttributes || [];
            const getAttribute = (name) => attributes.find((attr) => attr.Name === name)?.Value;
            return {
                sub: result.Username || '',
                email: getAttribute('email') || '',
                username: result.Username || '',
                given_name: getAttribute('given_name'),
                family_name: getAttribute('family_name'),
                email_verified: getAttribute('email_verified') === 'true',
                phone_number: getAttribute('phone_number'),
                phone_number_verified: getAttribute('phone_number_verified') === 'true',
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user data:', error);
            throw new Error('User not found');
        }
    }
    async setUserPassword(username, password) {
        const command = new client_cognito_identity_provider_1.AdminSetUserPasswordCommand({
            UserPoolId: this.userPoolId,
            Username: username,
            Password: password,
            Permanent: true,
        });
        await this.client.send(command);
    }
    async deleteUser(username) {
        try {
            const command = new client_cognito_identity_provider_1.AdminDeleteUserCommand({
                UserPoolId: this.userPoolId,
                Username: username,
            });
            await this.client.send(command);
        }
        catch (error) {
            logger_1.logger.error('Failed to delete user:', error);
            throw new Error('Failed to delete user');
        }
    }
}
exports.CognitoService = CognitoService;
exports.cognitoService = new CognitoService();
//# sourceMappingURL=cognito.js.map