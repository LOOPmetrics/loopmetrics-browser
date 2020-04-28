The official browser SDK for LOOPmetrics.

## Installation

```sh
npm install loopmetrics-browser
or
yarn add loopmetrics-browser
```

## Basic Usage

Import the SDK

```ts
import loopmetrics from "loopmetrics-browser"
or
import { loopmetrics } from "loopmetrics-browser"
```

Initiate the SDK

```ts
loopmetrics.init({
    apiKey: "your-api-key" // you can generate an API key in the settings of the LOOPmetrics web app
  })
```

Send an event

```ts
loopmetrics.track("eventName", { propertyName: "propertyValue" })
```

## API

Below is an explanation for how to use the API exposed by the SDK.

### loopmetrics.init(config)

Calling lopmetrics.init is required before tracking any events. This method takes a config object with the following properties.

```ts
const config = {
  apiKey: string // required
  tenant?: {
    distinctId: string // required if the tenant object is passed
    companyName: string // required if the tenant object is passed
    properties?: object // up to 50 key value pairs. The values have to be of type string, number or boolean
  }
  user?: {
    distinctId: string // required if the user object is passed
    firstName?: string
    lastName?: string
    email?: string
    properties?: object // up to 50 key value pairs. The values have to be of type string, number or boolean
  }
}
```

### loopmetrics.track(eventName[, properties, callback])

##### eventName(required): A string that represents the event to track

##### properties(optional): Up to 50 key value pairs. The values have to be of type string, number or boolean

##### callback(optional): A callback that will be fired after tracking the event was successfully finished

### loopmetrics.trackOnInit(eventName[, properties, callback])

This method accepts the same arguments as loopmetrics.track. The difference is that it is called exactly once right after the SDK was successfully initialized as opposed to loopmetrics.track, which is called as soon as it is executed. This method is useful to track events that may fire before the SDK finished initializing such as page views.

### loopmetrics.updateTenant(tenantConfig)

Tracks or updates tenant information.

##### distinctId(required): A string that represents the unique identifier of the tenant

##### companyName(required): A string that represents the company's name

##### properties(optional): Up to 50 key value pairs. The values have to be of type string, number or boolean

### loopmetrics.updateUser(userConfig)

Tracks or updates user information.

##### distinctId(required): A string that represents the unique identifier of the user

##### firstName(optional): A string that represents the user's first name

##### lastName(optional): A string that represents the user's last name

##### email(optional): A string that represents the user's email address

##### properties(optional): Up to 50 key value pairs. The values have to be of type string, number or boolean