"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
const jwt_service_1 = require("../common/jwt.service");
let LinksService = class LinksService {
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async getPublicLinks(userId) {
        if (!userId) {
            throw new common_1.BadRequestException("User ID required");
        }
        const links = await this.prisma.link.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        return links;
    }
    async saveLinks(authHeader, payload) {
        if (!authHeader?.startsWith("Bearer ")) {
            throw new common_1.UnauthorizedException("Unauthorized");
        }
        const token = authHeader.slice(7);
        const jwtPayload = await this.jwt.verify(token);
        if (!jwtPayload) {
            throw new common_1.UnauthorizedException("Unauthorized");
        }
        const { userId, links } = payload;
        if (!userId || !Array.isArray(links)) {
            throw new common_1.BadRequestException("Invalid request data");
        }
        if (jwtPayload.id !== userId) {
            throw new common_1.UnauthorizedException("Unauthorized");
        }
        await this.prisma.link.deleteMany({ where: { userId } });
        if (links.length > 0) {
            await this.prisma.link.createMany({
                data: links.map((l) => ({
                    userId,
                    platform: l.platform,
                    url: l.url,
                })),
            });
        }
        return { success: true, message: "Links saved successfully" };
    }
};
exports.LinksService = LinksService;
exports.LinksService = LinksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        jwt_service_1.JwtService])
], LinksService);
