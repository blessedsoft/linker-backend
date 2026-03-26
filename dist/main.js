"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix("api");
    app.enableCors({
        origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        allowedHeaders: "Content-Type, Authorization",
    });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    common_1.Logger.log(`Backend running on http://localhost:${port}/api`, "Bootstrap");
}
bootstrap();
