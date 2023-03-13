import express, { Express, Request, Response } from 'express';
import { AcknowledgeMessageToResource, CancelRequestFromClientMessage, isInitializeMessageFromResource, isPingMessageFromResource, isRequestFromClient, isResponseToClient, RequestFromClient } from './types';
import { Server as WSServer } from 'ws'
import * as http from 'http'
import ResourceManager, { Resource } from './ResourceManager';

if (!process.env.PROXY_SECRET) {
    throw Error(`Environment variable not set: PROXY_SECRET`)
}

const expressApp: Express = express()
const expressServer = http.createServer(expressApp)

const port = process.env.PORT || 3030

expressApp.use(express.json())

const resourceManager = new ResourceManager()

expressApp.get('/probe', (req: Request, res: Response) => {
    res.send('running.')
})

expressApp.post('/api', (req: Request, res: Response) => {
    ;(async () => {
        const request = req.body
        if (isRequestFromClient(request)) {
            const resource = resourceManager.getResource(request.resourceName)
            if (!resource) {
                res.status(404).send({message: `resource not found: ${request.resourceName}`})
                return
            }
            if (request.requestId) {
                res.status(400).send({message: `requestId field not allowed`})
                return
            }
            request.requestId = randomAlphaString(10)
            resource.handleRequestFromClient(request)

            let gotResponse = false
            req.on('close', () => {
                if (!gotResponse) {
                    resource.cancelRequestFromClient(request.requestId)
                }
            })

            const response = await resource.waitForResponseToClient(request.requestId, request.timeoutMsec)
            if (!response) {
                res.status(504).send({message: `timeout waiting for response`})
                return
            }
            gotResponse = true
            res.send(response)
        }
        else {
            res.status(400).send({message: 'invalid request'})
        }
    })().catch(err => {
        // internal server error
        res.status(500).send({message: err.message})
    })
})

const wss: WSServer = new WSServer({server: expressServer})
wss.on('connection', (ws) => {
    console.info('New websocket connection.')
    let initialized = false
    let resourceName = ''
    let resource: Resource | undefined = undefined
    ws.on('message', msg => {
        const messageJson = msg.toString()
        let message: any
        try {
            message = JSON.parse(messageJson)
        }
        catch(err) {
            console.error(`Error parsing message. Closing ${resourceName}`)
            ws.close()
            return
        }
        if (isInitializeMessageFromResource(message)) {
            if (initialized) {
                console.error(`Websocket already initialized: ${resourceName}`)
                ws.close()
                return
            }
            if (message.proxySecret !== process.env.PROXY_SECRET) {
                console.error(`Incorrect proxy secret. Closing.`)
                ws.close()
                return
            }
            initialized = true
            resourceName = message.resourceName
            if (resourceManager.hasResource(resourceName)) {
                console.error(`Resource already exists: ${resourceName}`)
                ws.close()
                return
            }
            const handleRequestFromClient = (request: RequestFromClient) => {
                ws.send(JSON.stringify(request))
            }
            const handleCancelRequestFromClient = (requestId: string) => {
                const msg: CancelRequestFromClientMessage = {
                    type: 'cancelRequestFromClient',
                    requestId
                }
                ws.send(JSON.stringify(msg))
            }
            console.info(`RESOURCE CONNECTED: ${resourceName}`)
            resource = resourceManager.addResource(resourceName, handleRequestFromClient, handleCancelRequestFromClient)
            const acknowledgeMessage: AcknowledgeMessageToResource = {
                type:'acknowledge'
            }
            ws.send(JSON.stringify(acknowledgeMessage))
            return
        }
        if (!initialized) {
            console.error('Expected initialize message from websocket. Closing.')
            ws.close()
            return
        }
        if (!resource) {
            console.error('Unexpected, resource is undefined. Closing.')
            ws.close()
            return
        }
        if (isResponseToClient(message)) {
            if (!message.requestId) {
                console.error(`No requestId in message from websocket. Closing ${resourceName}`)
                ws.close()
                return
            }
            resource.handleResponseToClient(message)
        }
        else if (isPingMessageFromResource(message)) {
            // ping
        }
        else {
            console.error(`Unexpected message from resource. Closing ${resourceName}`)
            ws.close()
        }
    })
    ws.on('close', () => {
        if (resourceName) {
            if (resourceManager.hasResource(resourceName)) {
                resourceManager.removeResource(resourceName)
            }
            if (resource) {
                resource = undefined
            }
        }
    })
})

expressServer.listen(port, () => {
    return console.log(`[server]: Server is running on port ${port}`)
})

export const randomAlphaString = (num_chars: number) => {
    if (!num_chars) {
        /* istanbul ignore next */
        throw Error('randomAlphaString: num_chars needs to be a positive integer.')
    }
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for (var i = 0; i < num_chars; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}