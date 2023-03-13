import { randomAlphaString } from ".";
import { RequestFromClient, ResponseToClient } from "./types";

export class Resource {
    #responseToClientCallbacks: {[id: string]: (response: ResponseToClient) => void} = {}
    constructor(public zone: string, private onRequestFromClient: (req: RequestFromClient) => void) {

    }
    handleRequestFromClient(request: RequestFromClient) {
        this.onRequestFromClient(request)
    }
    handleResponseToClient(response: ResponseToClient) {
        for (let id in this.#responseToClientCallbacks) {
            this.#responseToClientCallbacks[id](response)
        }
    }
    async waitForResponseToClient(requestId: string, timeoutMsec: number): Promise<ResponseToClient | undefined> {
        return new Promise((resolve) => {
            let finished = false
            const cancelCallback = this._onResponseToClient(response => {
                if (response.requestId === requestId) {
                    if (!finished) {
                        finished = true
                        cancelCallback()
                        resolve(response.response)
                    }
                }
            })
            setTimeout(() => {
                if (!finished) {
                    finished = true
                    cancelCallback()
                    resolve(undefined)
                }
            }, timeoutMsec)
        })
    }
    _onResponseToClient(callback: (response: ResponseToClient) => void) {
        const id = randomAlphaString(10)
        this.#responseToClientCallbacks[id] = callback
        return () => {
            delete this.#responseToClientCallbacks[id]
        }
    }
}

class ResourceManager {
    resources: {[resourceName: string]: Resource} = {}
    getResource(resourceName: string): Resource | undefined {
        if (resourceName in this.resources) {
            return this.resources[resourceName]
        }
        else {
            return undefined
        }
    }
    hasResource(resourceName: string) {
        return this.getResource(resourceName) !== undefined
    }
    addResource(resourceName: string, zone: string, onRequestFromClient: (request: RequestFromClient) => void) {
        if (this.hasResource(resourceName)) {
            throw Error('unexpected. resource already exists.')
        }
        const r = new Resource(zone, onRequestFromClient)
        this.resources[resourceName] = r
        return r
    }
    removeResource(resourceName: string) {
        if (!this.hasResource(resourceName)) {
            throw Error('unexpected. cannot remove resource that does not exist.')
        }
        delete this.resources[resourceName]
    }
}

export default ResourceManager