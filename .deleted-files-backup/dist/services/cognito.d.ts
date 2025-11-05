export interface CognitoUserData {
    sub: string;
    email: string;
    username: string;
    given_name?: string;
    family_name?: string;
    email_verified?: boolean;
    phone_number?: string;
    phone_number_verified?: boolean;
}
export interface AuthResult {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    user: CognitoUserData;
}
export interface SignUpRequest {
    email: string;
    username?: string;
    password: string;
    firstName?: string;
    lastName?: string;
}
export interface SignInRequest {
    usernameOrEmail: string;
    password: string;
}
export declare class CognitoService {
    private client;
    private userPoolId;
    private clientId;
    constructor();
    signUp(request: SignUpRequest): Promise<{
        userId: string;
        needsConfirmation: boolean;
    }>;
    signIn(request: SignInRequest): Promise<AuthResult>;
    getUserData(username: string): Promise<CognitoUserData>;
    private setUserPassword;
    deleteUser(username: string): Promise<void>;
}
export declare const cognitoService: CognitoService;
//# sourceMappingURL=cognito.d.ts.map