import axios, { AxiosInstance } from "axios"
import { UAParser } from "ua-parser-js"
import { v4 } from "uuid"

type TrackedTenantSdkBody = {
  id: string
  companyName: string
  properties?: any
}

type TrackedUserSdkBody = {
  internalTenantId?: string
  id: string
  tenantId?: string
  firstName?: string
  lastName?: string
  email?: string
  session?: SessionSdkBody
  properties?: any
}

type CreateOrUpdateEventSdkBody = {
  internalTenantId?: string
  internalUserId: string
  tenantId?: string
  userId: string
  name: string
  properties?: any
  session: SessionSdkBody
}

type SessionSdkBody = {
  sessionId?: string
  os?: string
  osVersion?: string
  browser?: string
  browserVersion?: string
  country?: string
  region?: string
}

type InsertOrUpdateTrackedTenantSdkResponse = {
  internalTenantId?: string
}

type InsertOrUpdateTrackedUserSdkResponse = {
  internalUserId: string
  sessionId: string
  sessionUpdatedAt: string
}

type ClientApi = {
  init: (config: Config) => void
  track: (
    eventName: string,
    eventProperties?: Record<string, string | number | boolean>,
    callback?: () => void
  ) => void
  trackOnInit: (
    eventName: string,
    eventProperties?: Record<string, string | number | boolean>,
    callback?: () => void
  ) => Promise<void>
  updateTenant: (tenant: TenantConfig) => void
  updateUser: (user: UserConfig) => void
}

type Config = {
  apiKey: string
  tenant?: TenantConfig
  user?: UserConfig
}

type TenantConfig = {
  distinctId: string
  companyName: string
  properties?: Record<string, string | number | boolean>
}

type UserConfig = {
  distinctId: string
  firstName?: string
  lastName?: string
  email?: string
  properties?: Record<string, string | number | boolean>
}

type InternalConfig = {
  session: {
    sessionId?: string
    updatedAt?: string
    os?: string
    osVersion?: string
    browser?: string
    browserVersion?: string
    country?: string
    region?: string
  }
}

class LoopmetricsClient implements ClientApi {
  private internalTenantId: string | undefined
  private internalUserId!: string
  private config!: Config & InternalConfig
  private httpClient!: AxiosInstance

  private onInitEvents: {
    eventName: string
    eventProperties?: Record<string, string | number | boolean>
    callback?: () => void
  }[] = []

  async init(config: Config) {
    const httpClient = axios.create({
      baseURL: "https://api.loopmetrics.jp",
      headers: {
        "x-api-key": config.apiKey
      }
    })
    this.httpClient = httpClient
    this.config = { ...config, session: {} }

    if (config.user === undefined || config.user.distinctId === undefined) {
      this.getDistinctUserIdFromLocalStorage()
    }

    if (config.tenant) {
      const tenantRes = await this.updateTenantAsync(config.tenant)
      this.internalTenantId = tenantRes.internalTenantId
    }
    if (config.user) {
      const userRes = await this.updateUserAsync(config.user)
      this.internalUserId = userRes.internalUserId
      this.config.session.sessionId = userRes.sessionId
      this.config.session.updatedAt = userRes.sessionUpdatedAt
    }

    this.onInitEvents.forEach(event => {
      this.track(event.eventName, event.eventProperties, event.callback)
    })
  }

  async track(
    eventName: string,
    eventProperties?: Record<string, string | number | boolean>,
    callback?: () => void
  ): Promise<void> {
    if (!this.internalUserId) {
      const propertiesMessage = eventProperties ? ` with properties {JSON.stringify(eventProperties)}` : ""
      console.warn(
        `Loopmetrics sdk has not yet finished initializing. Event ${eventName}${propertiesMessage} was not sent.`
      )
      return
    }

    try {
      const res = await this.httpClient.post<{ session: { id: string; updatedAt: string } }>(
        "/v1/track/events",
        this.appendProperties<CreateOrUpdateEventSdkBody>(
          {
            internalTenantId: this.internalTenantId,
            internalUserId: this.internalUserId,
            tenantId: this.config.tenant?.distinctId,
            userId: this.config.user?.distinctId as string,
            name: eventName,
            session: this.config.session
          },
          eventProperties
        )
      )
      this.config.session.sessionId = res.data.session.id
      this.config.session.updatedAt = res.data.session.updatedAt

      if (callback) callback()
    } catch (e) {
      console.error(e)
    }
  }

  async trackOnInit(
    eventName: string,
    eventProperties?: Record<string, string | number | boolean>,
    callback?: () => void
  ) {
    this.onInitEvents.push({ eventName, eventProperties, callback })
  }

  updateTenant(updatedTenant: TenantConfig): void {
    const tenant = {
      ...this.config.tenant,
      ...updatedTenant
    }
    this.httpClient.post<InsertOrUpdateTrackedTenantSdkResponse>(
      "/v1/track/tenants",
      this.appendProperties<TrackedTenantSdkBody>(
        {
          id: tenant.distinctId,
          companyName: tenant.companyName
        },
        tenant.properties
      )
    )
  }

  private async updateTenantAsync(
    updatedTenant: TenantConfig
  ): Promise<InsertOrUpdateTrackedTenantSdkResponse> {
    const tenant = {
      ...this.config.tenant,
      ...updatedTenant
    }
    const res = await this.httpClient.post<InsertOrUpdateTrackedTenantSdkResponse>(
      "/v1/track/tenants",
      this.appendProperties<TrackedTenantSdkBody>(
        {
          id: tenant.distinctId,
          companyName: tenant.companyName
        },
        tenant.properties
      )
    )
    return res.data
  }

  updateUser(updatedUser: UserConfig): void {
    const user = {
      ...this.config.user,
      ...updatedUser
    }

    this.httpClient.post(
      "/v1/track/users",
      this.appendProperties<TrackedUserSdkBody>(
        {
          internalTenantId: this.internalTenantId,
          id: user.distinctId,
          tenantId: this.config.tenant?.distinctId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        },
        user.properties
      )
    )
  }

  private async updateUserAsync(updatedUser: UserConfig): Promise<InsertOrUpdateTrackedUserSdkResponse> {
    const geolocationRes = await this.getGeolocation()
    const ua = new UAParser()
    const session: InternalConfig["session"] = {
      browser: ua.getBrowser().name,
      browserVersion: ua.getBrowser().major,
      os: ua.getOS().name,
      osVersion: ua.getOS().version,
      country: geolocationRes?.country,
      region: geolocationRes?.region
    }

    const user = {
      ...this.config.user,
      ...updatedUser
    }

    const res = await this.httpClient.post<InsertOrUpdateTrackedUserSdkResponse>(
      "/v1/track/users",
      this.appendProperties<TrackedUserSdkBody>(
        {
          internalTenantId: this.internalTenantId,
          id: user.distinctId,
          tenantId: this.config.tenant?.distinctId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          session
        },
        user.properties
      )
    )
    return res.data
  }

  private async getGeolocation(): Promise<
    | {
        country: string
        region: string
      }
    | undefined
  > {
    // TODO: upgrade to paid plan and use https
    const res = await axios.get<
      { status: "success"; country: string; regionName: string } | { status: "fail" }
    >("http://ip-api.com/json?fields=status,message,country,regionName&lang=ja")

    if (res.data.status === "fail") {
      return await new Promise<{ country: string; region: string } | undefined>(resolve => {
        setTimeout(async () => {
          const res2 = await axios.get<
            { status: "success"; country: string; regionName: string } | { status: "fail" }
          >("http://ip-api.com/json?fields=status,message,country,regionName&lang=ja")

          if (res2.data.status === "fail") {
            resolve(undefined)
            return
          }

          resolve({
            country: res2.data.country,
            region: res2.data.regionName
          })
        }, 3000)
      })
    }

    return {
      country: res.data.country,
      region: res.data.regionName
    }
  }

  private getDistinctUserIdFromLocalStorage() {
    const userId = localStorage.getItem("lm_s")
    if (userId !== null) {
      this.config.user = {
        ...this.config.user,
        distinctId: userId
      }
    } else {
      localStorage.setItem("lm_s", v4())
      const newUserId = localStorage.getItem("lm_s")
      this.config.user = {
        ...this.config.user,
        distinctId: newUserId as string
      }
    }
  }

  private appendProperties<T extends Record<string, any>>(
    obj: T,
    properties: Record<string, string | number | boolean> | undefined
  ): T | (T & { properties: Record<string, string | number | boolean> }) {
    return properties === undefined ? obj : { ...obj, properties }
  }
}

export const loopmetrics = new LoopmetricsClient()
export default loopmetrics
