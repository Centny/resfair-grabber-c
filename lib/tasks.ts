import http = require("http");
import url = require('url');

export interface WebCallback {
    mid: string;
    url: string;
    headers?: { [key: string]: any; };
    onDone(data: string | Buffer, err?: Error, request?: http.ClientRequest, response?: http.ClientResponse): any;
}

export class WebQueue {
    public max: number = 100;
    //the delay time mapping by mid.
    public delay: { [key: string]: number } = {};
    //the running count.
    private running: number = 0;
    //the WebCallback queue
    private queue: Array<WebCallback> = new Array<WebCallback>();
    //the time of last executed, the key is mid
    private last: { [key: string]: number } = {};
    //
    public doWeb(WebCallback: WebCallback): boolean {
        if (this.running >= this.max) {
            this.queue.push(WebCallback);
            return false;
        } else {
            this.doWeb_(WebCallback);
            return true;
        }
    }
    private doWeb_(back: WebCallback) {
        console.log("[WebQueue] do web task(" + back.mid + ") by", back.url);
        var queue = this;
        var turl = new url.URL(back.url);
        let options: http.RequestOptions = {
            method: "GET",
            host: turl.host,
            hostname: turl.hostname,
            port: turl.port,
            protocol: turl.protocol,
            headers: back.headers,
        };
        let client = http.request(options, (res: http.IncomingMessage) => {
            if (res.statusCode != 200) {
                this.doDone_(back, "", new Error(`STATUS: ${res.statusCode}`), client, res);
                return;
            }
            let data = "";
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                this.doDone_(back, data, undefined, client, res);
            });
        });
        client.on("error", (err: Error) => {
            this.doDone_(back, "", err, client);
        });
        client.end();
        this.last[back.mid] = new Date().getTime();
        this.running++;
    }
    private doDone_(back: WebCallback, data: string | Buffer, err?: Error, request?: http.ClientRequest, response?: http.ClientResponse) {
        this.running--;
        this.doNexWeb_();
        back.onDone(data, err, request, response);
    }
    private doNexWeb_() {
        console.log("[WebQueue] do next task by", this.running, "running and", this.queue.length, "queue");
        let now = new Date().getTime();
        let min = 100000000;
        for (let i = 0; i < this.queue.length; i++) {
            if (this.running >= this.max) {
                break;
            }
            let WebCallback = this.queue[i];
            let delay = this.delay[WebCallback.mid];
            if (!delay) {
                this.queue.splice(i, 1);
                this.doWeb_(WebCallback);
                continue;
            }
            let last = this.last[WebCallback.mid];
            if (!last) {
                this.queue.splice(i, 1);
                this.doWeb_(WebCallback);
                continue;
            }
            let pass = now - last;
            if (pass > delay) {
                this.queue.splice(i, 1);
                this.doWeb_(WebCallback);
                continue;
            }
            //get the min wait time.
            let wait = delay - pass + 10;
            if (min > wait) {
                min = wait;
            }
        }
        if (min < 100000000 && min > 0 && this.running < this.max) {
            console.log("[WebQueue] having delay task will start after", min, "ms");
            setTimeout(() => this.doNexWeb_(), min + 100);
        }
    }
}

export let SharedQueue = new WebQueue();

export default function () { }