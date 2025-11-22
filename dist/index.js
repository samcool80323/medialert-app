"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const scanner_1 = require("./routes/scanner");
const adCreator_1 = require("./routes/adCreator");
const init_1 = require("./database/init");
const cleanup_1 = require("./services/cleanup");
const errorHandler_1 = require("./middleware/errorHandler");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'), // 10 requests per window
    message: {
        error: 'Too many requests',
        message: 'Please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// API routes
app.use('/api/scanner', scanner_1.scannerRouter);
app.use('/api/ad-creator', adCreator_1.adCreatorRouter);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
    });
});
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express_1.default.static(path_1.default.join(__dirname, '../client')));
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(__dirname, '../client/index.html'));
    });
}
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
    });
});
async function startServer() {
    try {
        // Initialize database
        await (0, init_1.initializeDatabase)();
        console.log('✅ Database initialized');
        // Start cleanup scheduler
        (0, cleanup_1.startCleanupScheduler)();
        console.log('✅ Cleanup scheduler started');
        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 MediGuard AI server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 API available at: http://localhost:${PORT}/api`);
            if (process.env.NODE_ENV !== 'production') {
                console.log(`🌐 Frontend proxy: http://localhost:3000`);
            }
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});
// Start the server
startServer();
