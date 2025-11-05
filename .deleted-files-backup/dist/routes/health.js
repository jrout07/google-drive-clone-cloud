"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const dbHealthy = await (0, database_1.healthCheck)();
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
            services: {
                database: dbHealthy ? 'healthy' : 'unhealthy',
                memory: {
                    used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
                    total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
                },
            },
        };
        const statusCode = dbHealthy ? 200 : 503;
        res.status(statusCode).json(healthStatus);
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
        });
    }
});
router.get('/ready', async (req, res) => {
    try {
        const dbHealthy = await (0, database_1.healthCheck)();
        if (dbHealthy) {
            res.status(200).json({ status: 'ready' });
        }
        else {
            res.status(503).json({ status: 'not ready', reason: 'database unavailable' });
        }
    }
    catch (error) {
        res.status(503).json({ status: 'not ready', reason: 'health check failed' });
    }
});
router.get('/live', (req, res) => {
    res.status(200).json({ status: 'alive' });
});
exports.default = router;
//# sourceMappingURL=health.js.map