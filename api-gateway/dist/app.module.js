"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_proxy_module_1 = require("./auth-proxy/auth-proxy.module");
const logging_middleware_1 = require("./common/logging.middleware");
const users_proxy_module_1 = require("./users-proxy/users-proxy.module");
const tweets_proxy_module_1 = require("./tweets-proxy/tweets-proxy.module");
const notifications_proxy_module_1 = require("./notifications-proxy/notifications-proxy.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(logging_middleware_1.LoggingMiddleware).forRoutes('*path');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_proxy_module_1.AuthProxyModule, users_proxy_module_1.UsersProxyModule, tweets_proxy_module_1.TweetsProxyModule, notifications_proxy_module_1.NotificationsProxyModule],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map