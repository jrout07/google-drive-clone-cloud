export interface CognitoUser {
    sub: string;
    email: string;
    given_name: string;
    family_name: string;
    picture?: string;
}
export interface JWTPayload {
    userId: string;
    email: string;
    cognitoUserId: string;
}
export declare class AuthService {
    private cognitoVerifier;
    constructor();
    verifyCognitoToken(token: string): Promise<CognitoUser>;
    generateJWT(payload: JWTPayload): string;
    verifyJWT(token: string): JWTPayload;
    extractTokenFromHeader(authHeader: string): string;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.d.ts.map