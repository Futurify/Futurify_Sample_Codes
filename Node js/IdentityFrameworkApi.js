/*
 * IdentityFrameworkApi.js
 * api/dhome/services
 */

const uuid = require("uuid/v4")
const querystring = require("querystring")
const DreamFactoryApi = require("./DreamFactoryApi")
const DreamFactoryQueryBuilder = require("./DreamFactoryQueryBuilder")

let sharedService = null

class IdentityFrameworkApi {
    static get shared() {
        return sharedService
    }

    constructor() {
        if (!sharedService) {
            sharedService = this
        }
        // One day, we can replace DF with something else
        this.api = DreamFactoryApi.shared
    }

    /**
     * Authenticates by identifier and hashed challenge.
     * Responds with either true or false.
     *
     * @param {String} identifier
     * @param {String} challengeHash Because we don't save passwords in plain text.
     * @param {String} type Identity type.
     */
    authenticateIdentity(identifier, challengeHash, type = "userpass") {
        const params = DreamFactoryQueryBuilder.where("identifier", "=", identifier)
            .and("challenge", "=", challengeHash)
            .and("type", "=", type)
            .and("verified", "=", true)
            .limitTo(1)
            .build()
        return this.api.get("dhome-data-rw/_table/identities", params, (data) => {
            const jsonData = JSON.parse(data)
            if (!jsonData) {
                return null
            }

            if (jsonData.resource && Array.isArray(jsonData.resource) && jsonData.resource.length > 0) {
                return Object.assign({}, jsonData.resource[0])
            }
            return null
        })
    }

    addProfile(profile) {
        const newProfile = Object.assign({}, profile, {
            "uuid": profile.uuid || uuid()
        })
        return this.api.post("dhome-data-rw/_table/user_profiles", { "resource": newProfile })
    }

    updateProfile(profile) {
        return this.api.patch(`dhome-data-rw/_table/user_profiles/${profile.uuid}`, Object.assign({}, profile, { "uuid": undefined }))
    }

    deleteProfile(profile) {
        return this.api.delete(`dhome-data-rw/_table/user_profiles/${profile.uuid}`)
    }

    /**
     * Responds with profile (if found) along with all identities belonging to the
     * profile.
     *
     * @param {String} uuid Profile UUIDs.
     */
    getProfileAndIdentitiesByProfileUuids(...uuids) {
        const params = DreamFactoryQueryBuilder.where("user_profile_uuid", "IN", uuids)
            .includeRelationship("user_profiles_by_user_profile_uuid")
            .build()

        return this.api.get("dhome-data-rw/_table/identities", params, (data) => {
            const jsonData = JSON.parse(data)
            if (!jsonData || !jsonData.resource) {
                return null
            }
            if (jsonData.resource.length === 0) {
                return null
            }

            let profileMap = {}
            jsonData.resource.forEach((identity) => {
                if (!profileMap[identity.user_profile_uuid]) {
                    profileMap[identity.user_profile_uuid] = identity.user_profiles_by_user_profile_uuid
                    profileMap[identity.user_profile_uuid].identities = []
                }
                profileMap[identity.user_profile_uuid].identities.push(Object.assign({}, identity, {
                    "user_profile_uuid": undefined,
                    "user_profiles_by_user_profile_uuid": undefined,
                    "challenge": undefined,
                    "identifier_key": undefined,
                    "reset_code": undefined
                }))
            })

            const profiles = []
            Object.keys(profileMap).forEach((key) => {
                profiles.push(profileMap[key])
            })

            if (profiles.length === 1) {
                return profiles[0]
            }
            return profiles
        })
    }

    /**
     * @param {String} uuid Profile UUID
     */
    getProfileByUuid(uuid) {
        return this.api.get(`dhome-data-rw/_table/user_profiles/${uuid}`)
    }

    /**
     * @param {Array<String>} uuid Profile UUIDs array.
     */
    getProfilesByUuid(uuids) {
        const query = querystring.stringify({
            "filter": `(uuid IN (${uuids.join(",")}))`
        })
        return this.api.get(`dhome-data-rw/_table/user_profiles?${query}`)
    }

    getIdentityByUuid(uuid) {
        return this.api.get(`dhome-data-rw/_table/identities/${uuid}`)
    }

    /**
     * Adds a new identity.
     * @param {Identity} identity
     */
    addIdentity(identity) {
        const newIdentity = Object.assign({}, identity, {
            "uuid": identity.uuid || uuid()
        })
        return this.api.post("dhome-data-rw/_table/identities", { "resource": newIdentity })
    }

    /**
     * Updates existing identity based on `identity.uuid`.
     * @param {Identity} identity (`uuid` is required).
     */
    updateIdentity(identity) {
        return this.api.patch(`dhome-data-rw/_table/identities/${identity.uuid}`, identity)
    }

    /**
     * Get all identities belonging to user profile.
     * @param {Profile} profile
     */
    getIdentitiesBelongingTo(profile) {
        const params = DreamFactoryQueryBuilder.where("user_profile_uuid", "=", profile.uuid)
            .orderByAscending("uuid")
            .build()
        return this.api.get("dhome-data-rw/_table/identities", params)
    }

    /**
     * @param {String} identifier
     * @param {String} type
     * @param {boolean=} verified
     */
    findMatchingIdentities(identifier, type, verified = true) {
        const queryBuilder = DreamFactoryQueryBuilder.where("identifier", "=", identifier.trim())
            .and("type", "=", type)
            .and("verified", "=", verified)
            .includeRelationship("user_profiles_by_user_profile_uuid")
        return this.api.get("dhome-data-rw/_table/identities", queryBuilder.build())
    }

    /**
     * @param {String} activationCode
     */
    findIdentityWithActivationCode(activationCode) {
        const params = DreamFactoryQueryBuilder.where("activation_code", "=", activationCode.trim())
            .build()
        return this.api.get("dhome-data-rw/_table/identities", params)
    }

    /**
     * @param {String} resetCode
     */
    findIdentityWithResetCode(resetCode) {
        const params = DreamFactoryQueryBuilder.where("reset_code", "=", resetCode.trim())
            .build()
        return this.api.get("dhome-data-rw/_table/identities", params)
    }

    getProfilesLinkedWithProfileWithUuid(...uuids) {
        const params = DreamFactoryQueryBuilder.where("linked_profile_uuid", "IN", uuids)
            .includeRelationship("user_profiles_by_user_profile_uuid")
            .build()
        return this.api.get("dhome-data-rw/_table/linked_profiles", params)
    }

    /**
     * Request that saves relationships between linked profiles.
     * Remember that relationships are 2 ways, if A is linked with B,
     * B has to be linked with A too.
     *
     * @param {Array} linkedProfiles Array of linked profiles info (objects containing user_profile_id and linked_profile_id).
     */
    linkProfiles(linkedProfiles) {
        return this.api.post("dhome-data-rw/_table/linked_profiles", {
            "resource": linkedProfiles
        })
    }

    /**
     * Keep track of every session token issued so we can invalidate
     * (a.k.a. "blacklist") all sessions belonging to a user whenever he/she logs out
     * or have his/her access revoked.
     *
     * @param {Profile} profile
     * @param {String} sessionToken
     */
    trackSession(profile, sessionToken) {
        return this.api.post("dhome-data-rw/_table/user_sessions", {
            "resource": {
                "uuid": uuid(),
                "user_profile_uuid": profile.uuid,
                "session_token": sessionToken
            }
        })
    }

    /**
     * Checks whether this session token is still valid.
     * Responds with either true or false.
     *
     * @param {String} sessionToken JWT session token
     */
    isSesionValid(sessionToken) {
        const params = DreamFactoryQueryBuilder.where("session_token", "=", sessionToken)
            .and("is_valid", "=", true)
            .limitTo(1)
            .build()
        return this.api.get("dhome-data-rw/_table/user_sessions", params, (data) => {
            const jsonData = JSON.parse(data)
            if (!jsonData) {
                return null
            }

            if (jsonData.resource && Array.isArray(jsonData.resource) && jsonData.resource.length > 0) {
                return jsonData.resource[0]
            }
            return null
        })
    }

    invalidateSessionWithUuid(uuid) {
        return this.api.patch(`dhome-data-rw/_table/user_sessions/${uuid}`, { "is_valid": false })
    }

    invalidateAllSessions(userProfile) {
        return this.api.patch("dhome-data-rw/_table/user_sessions", {
            "filter": `(user_profile_uuid = ${userProfile.uuid})`,
            "resource": { "is_valid": false }
        })
    }
}

new IdentityFrameworkApi()
module.exports = IdentityFrameworkApi
