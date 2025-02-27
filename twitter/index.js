
/**
 * Twitter client API wrapper around agent-twitter-client
 */
const express = require('express')
const { Scraper } = require('agent-twitter-client')

class TwitterClientApi {
    constructor() {
        /** @type {express.Express} */
        this.app = express()
        this.app.use(express.json())
        /** @type {Scraper|null} */
        this.scraper = null
    }

    /**
     * @typedef {Object} InitializeRequest
     * @property {string} username - Twitter username
     * @property {string} password - Twitter password 
     * @property {string} email - Twitter email
     * @property {string} consumerKey - Twitter API consumer key
     * @property {string} consumerSecret - Twitter API consumer secret
     * @property {string} accessToken - Twitter API access token
     * @property {string} accessTokenSecret - Twitter API access token secret
     */

    /**
     * Initialize the Twitter client with credentials
     * @param {express.Request} req - Express request object containing initialization params
     * @param {express.Response} res - Express response object
     * @returns {Promise<void>}
     */
    async initialize(req, res) {
        try {
            console.log('initialize')

            this.scraper = new Scraper()
            
            /** @type {InitializeRequest} */
            const initializeRequest = req.body

            const twoFactorSecret = process.env.AGENT_TWITTER_CLIENT_2FA_SECRET

            await this.scraper.login(
                initializeRequest.username,
                initializeRequest.password,
                initializeRequest.email,
                twoFactorSecret,
                initializeRequest.consumerKey,
                initializeRequest.consumerSecret,
                undefined,
                undefined
            )
            
            res.sendStatus(200)
        } catch (err) {
            console.error('Failed to initialize:', err)
            res.status(500).send(`${err}`)
        }
    }

    /**
     * Get a tweet by ID
     * @param {express.Request} req - Express request object containing tweet ID
     * @param {express.Response} res - Express response object
     * @returns {Promise<void>}
     */
    async getTweet(req, res) {
        try {
            console.log('getTweet', req.params.id)

            const tweetId = req.params.id
            const tweet = await this.scraper.getTweet(tweetId)
            res.send(tweet.text)
        } catch (err) {
            console.error('Failed to get tweet:', err)
            res.status(500).send(`${err}`)
        }
    }

    /**
     * Reply to a tweet
     * @param {express.Request} req - Express request object containing tweet ID and reply text
     * @param {express.Response} res - Express response object
     * @returns {Promise<void>}
     */
    async replyToTweet(req, res) {
        try {
            console.log('replyToTweet', req.params.id, req.body)

            const tweetId = req.params.id
            const { reply } = req.body
            await this.scraper.sendTweet(reply, tweetId)
            res.sendStatus(200)
        } catch (err) {
            console.error('Failed to reply to tweet:', err)
            res.status(500).send(`${err}`)
        }
    }

    /**
     * Send a tweet
     * @param {express.Request} req - Express request object containing tweet text
     * @param {express.Response} res - Express response object
     * @returns {Promise<void>}
     */
    async sendTweet(req, res) {
        try {
            console.log('sendTweet', req.body)

            const { tweet } = req.body
            await this.scraper.sendTweet(tweet)
            res.sendStatus(200)
        } catch (err) {
            console.error('Failed to send tweet:', err)
            res.status(500).send(`${err}`)
        }
    }
    /**
     * Start the API server
     * @param {number} port - Port number to listen on
     * @returns {Promise<void>}
     */
    run(port) {
        this.app.post('/initialize', this.initialize.bind(this))
        this.app.get('/tweet/:id', this.getTweet.bind(this))
        this.app.post('/reply/:id', this.replyToTweet.bind(this))
        this.app.post('/tweet', this.sendTweet.bind(this))

        return new Promise((resolve) => {
            this.app.listen(port, () => {
                console.log(`Twitter client API listening on port ${port}`)
                resolve()
            })
        })
    }
}

/**
 * Main entry point
 * @returns {Promise<void>}
 */
async function main() {
    const api = new TwitterClientApi()
    await api.run(parseInt(process.env.AGENT_TWITTER_CLIENT_PORT) || 3000)
}

main().catch(console.error)
