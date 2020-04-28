'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var tslib = require('tslib');
var axios = _interopDefault(require('axios'));
var uaParserJs = require('ua-parser-js');
var uuid = require('uuid');

class LoopmetricsClient {
    constructor() {
        this.onInitEvents = [];
    }
    init(config) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const httpClient = axios.create({
                baseURL: "https://api.loopmetrics.jp",
                headers: {
                    "x-api-key": config.apiKey
                }
            });
            this.httpClient = httpClient;
            this.config = Object.assign(Object.assign({}, config), { session: {} });
            if (config.user === undefined || config.user.distinctId === undefined) {
                this.getDistinctUserIdFromLocalStorage();
            }
            if (config.tenant) {
                const tenantRes = yield this.updateTenantAsync(config.tenant);
                this.internalTenantId = tenantRes.internalTenantId;
            }
            if (config.user) {
                const userRes = yield this.updateUserAsync(config.user);
                this.internalUserId = userRes.internalUserId;
                this.config.session.sessionId = userRes.sessionId;
                this.config.session.updatedAt = userRes.sessionUpdatedAt;
            }
            this.onInitEvents.forEach(event => {
                this.track(event.eventName, event.eventProperties, event.callback);
            });
        });
    }
    track(eventName, eventProperties, callback) {
        var _a, _b;
        return tslib.__awaiter(this, void 0, void 0, function* () {
            if (!this.internalUserId) {
                const propertiesMessage = eventProperties ? ` with properties {JSON.stringify(eventProperties)}` : "";
                console.warn(`Loopmetrics sdk has not yet finished initializing. Event ${eventName}${propertiesMessage} was not sent.`);
                return;
            }
            try {
                const res = yield this.httpClient.post("/v1/track/events", this.appendProperties({
                    internalTenantId: this.internalTenantId,
                    internalUserId: this.internalUserId,
                    tenantId: (_a = this.config.tenant) === null || _a === void 0 ? void 0 : _a.distinctId,
                    userId: (_b = this.config.user) === null || _b === void 0 ? void 0 : _b.distinctId,
                    name: eventName,
                    session: this.config.session
                }, eventProperties));
                this.config.session.sessionId = res.data.session.id;
                this.config.session.updatedAt = res.data.session.updatedAt;
                if (callback)
                    callback();
            }
            catch (e) {
                console.error(e);
            }
        });
    }
    trackOnInit(eventName, eventProperties, callback) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            this.onInitEvents.push({ eventName, eventProperties, callback });
        });
    }
    updateTenant(updatedTenant) {
        const tenant = Object.assign(Object.assign({}, this.config.tenant), updatedTenant);
        this.httpClient.post("/v1/track/tenants", this.appendProperties({
            id: tenant.distinctId,
            companyName: tenant.companyName
        }, tenant.properties));
    }
    updateTenantAsync(updatedTenant) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const tenant = Object.assign(Object.assign({}, this.config.tenant), updatedTenant);
            const res = yield this.httpClient.post("/v1/track/tenants", this.appendProperties({
                id: tenant.distinctId,
                companyName: tenant.companyName
            }, tenant.properties));
            return res.data;
        });
    }
    updateUser(updatedUser) {
        var _a;
        const user = Object.assign(Object.assign({}, this.config.user), updatedUser);
        this.httpClient.post("/v1/track/users", this.appendProperties({
            internalTenantId: this.internalTenantId,
            id: user.distinctId,
            tenantId: (_a = this.config.tenant) === null || _a === void 0 ? void 0 : _a.distinctId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        }, user.properties));
    }
    updateUserAsync(updatedUser) {
        var _a;
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const geolocationRes = yield this.getGeolocation();
            const ua = new uaParserJs.UAParser();
            const session = {
                browser: ua.getBrowser().name,
                browserVersion: ua.getBrowser().major,
                os: ua.getOS().name,
                osVersion: ua.getOS().version,
                country: geolocationRes === null || geolocationRes === void 0 ? void 0 : geolocationRes.country,
                region: geolocationRes === null || geolocationRes === void 0 ? void 0 : geolocationRes.region
            };
            const user = Object.assign(Object.assign({}, this.config.user), updatedUser);
            const res = yield this.httpClient.post("/v1/track/users", this.appendProperties({
                internalTenantId: this.internalTenantId,
                id: user.distinctId,
                tenantId: (_a = this.config.tenant) === null || _a === void 0 ? void 0 : _a.distinctId,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                session
            }, user.properties));
            return res.data;
        });
    }
    getGeolocation() {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const res = yield axios.get("http://ip-api.com/json?fields=status,message,country,regionName&lang=ja");
            if (res.data.status === "fail") {
                return yield new Promise(resolve => {
                    setTimeout(() => tslib.__awaiter(this, void 0, void 0, function* () {
                        const res2 = yield axios.get("http://ip-api.com/json?fields=status,message,country,regionName&lang=ja");
                        if (res2.data.status === "fail") {
                            resolve(undefined);
                            return;
                        }
                        resolve({
                            country: res2.data.country,
                            region: res2.data.regionName
                        });
                    }), 3000);
                });
            }
            return {
                country: res.data.country,
                region: res.data.regionName
            };
        });
    }
    getDistinctUserIdFromLocalStorage() {
        const userId = localStorage.getItem("lm_s");
        if (userId !== null) {
            this.config.user = Object.assign(Object.assign({}, this.config.user), { distinctId: userId });
        }
        else {
            localStorage.setItem("lm_s", uuid.v4());
            const newUserId = localStorage.getItem("lm_s");
            this.config.user = Object.assign(Object.assign({}, this.config.user), { distinctId: newUserId });
        }
    }
    appendProperties(obj, properties) {
        return properties === undefined ? obj : Object.assign(Object.assign({}, obj), { properties });
    }
}
const loopmetrics = new LoopmetricsClient();

exports.default = loopmetrics;
exports.loopmetrics = loopmetrics;
