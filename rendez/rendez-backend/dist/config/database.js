"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const env_1 = require("./env");
const globalForPrisma = globalThis;
// Connection pool: max 10 connections, 10s pool timeout, 20s connect timeout
// Render free tier has 97 max connections on the shared Postgres instance
const DATABASE_URL_WITH_POOL = env_1.env.DATABASE_URL.includes('?')
    ? `${env_1.env.DATABASE_URL}&connection_limit=10&pool_timeout=10&connect_timeout=20`
    : `${env_1.env.DATABASE_URL}?connection_limit=10&pool_timeout=10&connect_timeout=20`;
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        datasources: { db: { url: DATABASE_URL_WITH_POOL } },
        log: env_1.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
if (env_1.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
