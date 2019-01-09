/*
 * DreamFactoryService.js
 * api/dhome/services
 */

const axios = require("axios")
const querystring = require("querystring")
const inflection = require("inflection")


let sharedService = null

class DreamFactoryApi {
    static get shared() {
        return sharedService
    }

    static GETResponseTransformer() {
        return (data) => {
            const jsonData = JSON.parse(data)
            if (!jsonData.resource) {
                return Object.assign({}, DreamFactoryApi.itemWithCleanedUpRelatedItems(jsonData))
            }

            const resource = Array.isArray(jsonData.resource) ?
                jsonData.resource.map((item) => Object.assign({}, DreamFactoryApi.itemWithCleanedUpRelatedItems(item))) :
                Object.assign({}, DreamFactoryApi.itemWithCleanedUpRelatedItems(jsonData.resource))

            // Temporary additional data massaging to support older versions
            if (resource && Array.isArray(resource)) {
                resource.forEach((item) => {
                    for (let key in item) {
                        if (key === "blocks_by_block_uuid") {
                            continue
                        }
                        if (key.indexOf("_by_") !== -1) {
                            let newKey = key.substr(0, key.indexOf("_by_"))
                            if (!Array.isArray(item[key])) {
                                newKey = inflection.singularize(newKey)
                            }
                            item[newKey] = item[key]
                        }
                    }
                })
            } else {
                for (let key in resource) {
                    if (key === "blocks_by_block_uuid") {
                        continue
                    }
                    if (key.indexOf("_by_") !== -1) {
                        let newKey = key.substr(0, key.indexOf("_by_"))
                        if (!Array.isArray(resource[key])) {
                            newKey = inflection.singularize(newKey)
                        }
                        resource[newKey] = resource[key]
                    }
                }
            }

            return Object.assign({}, jsonData, {
                "resource": resource
            })
        }
    }

    static itemWithCleanedUpRelatedItems(item) {
        const parsedItem = Object.assign({}, item)
        Object.keys(parsedItem).forEach((key) => {
            if (key.indexOf("_by_") === -1) {
                return
            }

            const related = parsedItem[key]
            if (!related) {
                return
            }

            if (Array.isArray(related)) {
                const relatedItems = related
                if (relatedItems.length > 0 && relatedItems[0].hasOwnProperty("deleted_at")) {
                    parsedItem[key] = relatedItems.filter((relatedItem) => !relatedItem.deleted_at)
                }
            } else {
                if (related.hasOwnProperty("deleted_at") && related.deleted_at) {
                    parsedItem[key] = null
                }
            }
        })

        return parsedItem
    }

    constructor() {
        // config to staging server
        this.api = axios.create({
            "baseURL": "http://xxxxx.xxxxx.amazonaws.com:8080/api/v2",
            "timeout": 60000,
            "headers": {
                "X-DreamFactory-API-Key": "xxxxx"
            }
        })


        if (!sharedService) {
            sharedService = this
        }
    }

    request(method, path, query = null, payload = null) {
        delete this.api.defaults.headers["Content-Type"]

        const requestPath = query ? `${path}?${querystring.stringify(query)}` : path
        switch (method) {
            case "GET":
                return this.get(path, `?${querystring.stringify(query)}`, DreamFactoryApi.GETResponseTransformer())
            case "POST":
                return this.post(requestPath, payload)
            case "PUT":
                return this.put(requestPath, payload)
            case "PATCH":
                return this.patch(requestPath, payload)
            case "DELETE":
                return this.delete(requestPath, query)
        }
    }

    get(path, params = "", transformResponse = null) {
        delete this.api.defaults.headers["Content-Type"]

        const config = {}
        if (transformResponse) {
            config["transformResponse"] = transformResponse
        }

        return this.api.get(`${path}${params}`, config)
    }

    post(path, payload) {
        this.api.defaults.headers["Content-Type"] = "application/json"
        return this.api.post(path, payload)
    }

    put(path, payload) {
        this.api.defaults.headers["Content-Type"] = "application/json"
        return this.api.put(path, payload)
    }

    patch(path, payload) {
        this.api.defaults.headers["Content-Type"] = "application/json"
        return this.api.patch(path, payload)
    }

    delete(path, query = {}) {
        return this.api.delete(`${path}?${querystring.stringify(query)}`)
    }
}

new DreamFactoryApi()
module.exports = DreamFactoryApi
