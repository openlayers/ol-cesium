/**
 * @module olcs.contrib.LazyLoader
 */
export default class LazyLoader {
  /**
   * @param {string} url
   * @api
   */
  constructor(url) {
    /**
     * @type {Promise<undefined>}
     * @protected
     */
    this.promise;

    /**
     * @private
     * @type {string}
     */
    this.url_ = url;
  }

  /**
   * @return {Promise<undefined>}
   * @api
   */
  load() {
    if (!this.promise) {
      // not yet loading
      this.promise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
        script.src = this.url_;
      });
    }
    return this.promise;
  }
}
