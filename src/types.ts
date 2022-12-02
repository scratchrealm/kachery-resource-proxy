import validateObject, { isEqualTo, isNumber, isOneOf, isString, optional } from "./validateObject"

export type RequestFromClient = {
    type: 'requestFromClient'
    resourceName: string
    request: any
    requestId?: string // added when sending over websocket
}

export const isRequestFromClient = (x: any): x is RequestFromClient => {
    return validateObject(x, {
        type: isEqualTo('requestFromClient'),
        resourceName: isString,
        request: () => (true),
        requestId: optional(isString)
    })
}

export type ResponseToClient = {
    type: 'responseToClient'
    response: any
    requestId?: string // added when sending over websocket
}

export const isResponseToClient = (x: any): x is ResponseToClient => {
    return validateObject(x, {
        type: isEqualTo('responseToClient'),
        response: () => (true),
        requestId: optional(isString)
    })
}

export type InitializeMessageFromResource = {
    type: 'initialize'
    resourceName: string
    proxySecret: string
}

export const isInitializeMessageFromResource = (x: any): x is InitializeMessageFromResource => {
    return validateObject(x, {
        type: isEqualTo('initialize'),
        resourceName: isString,
        proxySecret: isString
    })
}

export type AcknowledgeMessageToResource = {
    type: 'acknowledge'
}

export const isAcknowledgeMessageToResource = (x: any): x is AcknowledgeMessageToResource => {
    return validateObject(x, {
        type: isEqualTo('initialize')
    })
}

export type CancelRequestFromClientMessage = {
    type: 'cancelRequestFromClient'
    requestId: string
}

export const isCancelRequestFromClientMessage = (x: any): x is CancelRequestFromClientMessage => {
    return validateObject(x, {
        type: isEqualTo('cancelRequestFromClient'),
        requestId: isString
    })
}

