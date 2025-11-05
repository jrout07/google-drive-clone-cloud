"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const logger_1 = require("../utils/logger");
class UserRepository {
    constructor(pool) {
        this.pool = pool;
    }
    async create(userData) {
        const query = `
      INSERT INTO users (email, first_name, last_name, cognito_user_id, profile_picture)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
        try {
            const result = await this.pool.query(query, [
                userData.email,
                userData.firstName,
                userData.lastName,
                userData.cognitoUserId,
                userData.profilePicture || null
            ]);
            return this.mapDbRowToUser(result.rows[0]);
        }
        catch (error) {
            logger_1.logger.error('Error creating user:', error);
            throw new Error('Failed to create user');
        }
    }
    async findById(id) {
        const query = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
        try {
            const result = await this.pool.query(query, [id]);
            return result.rows[0] ? this.mapDbRowToUser(result.rows[0]) : null;
        }
        catch (error) {
            logger_1.logger.error('Error finding user by id:', error);
            throw new Error('Failed to find user');
        }
    }
    async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
        try {
            const result = await this.pool.query(query, [email]);
            return result.rows[0] ? this.mapDbRowToUser(result.rows[0]) : null;
        }
        catch (error) {
            logger_1.logger.error('Error finding user by email:', error);
            throw new Error('Failed to find user');
        }
    }
    async findByCognitoId(cognitoUserId) {
        const query = 'SELECT * FROM users WHERE cognito_user_id = $1 AND is_active = true';
        try {
            const result = await this.pool.query(query, [cognitoUserId]);
            return result.rows[0] ? this.mapDbRowToUser(result.rows[0]) : null;
        }
        catch (error) {
            logger_1.logger.error('Error finding user by cognito id:', error);
            throw new Error('Failed to find user');
        }
    }
    async update(id, updateData) {
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (updateData.firstName !== undefined) {
            updates.push(`first_name = $${paramCount++}`);
            values.push(updateData.firstName);
        }
        if (updateData.lastName !== undefined) {
            updates.push(`last_name = $${paramCount++}`);
            values.push(updateData.lastName);
        }
        if (updateData.profilePicture !== undefined) {
            updates.push(`profile_picture = $${paramCount++}`);
            values.push(updateData.profilePicture);
        }
        if (updates.length === 0) {
            return this.findById(id);
        }
        values.push(id);
        const query = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount} AND is_active = true
      RETURNING *
    `;
        try {
            const result = await this.pool.query(query, values);
            return result.rows[0] ? this.mapDbRowToUser(result.rows[0]) : null;
        }
        catch (error) {
            logger_1.logger.error('Error updating user:', error);
            throw new Error('Failed to update user');
        }
    }
    async updateStorageUsed(id, storageUsed) {
        const query = 'UPDATE users SET storage_used = $1 WHERE id = $2';
        try {
            await this.pool.query(query, [storageUsed, id]);
        }
        catch (error) {
            logger_1.logger.error('Error updating storage used:', error);
            throw new Error('Failed to update storage used');
        }
    }
    async delete(id) {
        const query = 'UPDATE users SET is_active = false WHERE id = $1';
        try {
            const result = await this.pool.query(query, [id]);
            return (result.rowCount ?? 0) > 0;
        }
        catch (error) {
            logger_1.logger.error('Error deleting user:', error);
            throw new Error('Failed to delete user');
        }
    }
    mapDbRowToUser(row) {
        return {
            id: row.id,
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            profilePicture: row.profile_picture,
            storageUsed: parseInt(row.storage_used),
            storageLimit: parseInt(row.storage_limit),
            isActive: row.is_active,
            cognitoUserId: row.cognito_user_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=UserRepository.js.map