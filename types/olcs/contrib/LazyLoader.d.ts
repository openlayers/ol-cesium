/**
 * @module olcs.contrib.LazyLoader
 */
export default class LazyLoader {
    /**
     * @param {string} url
     * @api
     */
    constructor(url: string);
    /**
     * @type {Promise<undefined>}
     * @protected
     */
    protected promise: Promise<undefined>;
    /**
     * @private
     * @type {string}
     */
    private url_;
    /**
     * @return {Promise<undefined>}
     * @api
     */
    load(): Promise<undefined>;
}
