export default class LazyLoader {
  private promise: Promise<void> | undefined;
  private url_: string;

  /**
   * @param url
   * @api
   */
  constructor(url: string) {
    this.url_ = url;
  }

  /**
   * Load Cesium by injecting a script tag.
   * @api
   */
  load(): Promise<void> {
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
