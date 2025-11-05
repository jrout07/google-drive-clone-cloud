import { Pool } from 'pg';
import { User, CreateUserInput, UpdateUserInput } from '../models/User';
export declare class UserRepository {
    private pool;
    constructor(pool: Pool);
    create(userData: CreateUserInput): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByCognitoId(cognitoUserId: string): Promise<User | null>;
    update(id: string, updateData: UpdateUserInput): Promise<User | null>;
    updateStorageUsed(id: string, storageUsed: number): Promise<void>;
    delete(id: string): Promise<boolean>;
    private mapDbRowToUser;
}
//# sourceMappingURL=UserRepository.d.ts.map