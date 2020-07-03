/**
 * Douban 用户动态推送
 * @author: Derek
 * @version: 0.1.1
 */

let users = ["121769342", "1148126"];
let maxImgs = 3;
let len = 69;

const $ = API("Douban");
const debug = false;
if ($.read("douban_users") !== undefined) {
    users = JSON.parse($.read("douban_users"));
}
if ($.read("douban_maxImgs") !== undefined) {
    maxImgs = parseInt($.read("douban_maxImgs"));
}

const updated = JSON.parse($.read("douban_updated") || "{}");

Promise.all(
    users.map(async (user) => {
        await $.get(`https://rsshub.app/douban/people/${user}/status`)
            .then((response) => {
                if(response && response.body) {
                    const body = response.body.replace(/[\r\n\t\f\v]| {3,}/g, '');
                    const userName = body.match(/<title><!\[CDATA\[豆瓣广播 - (.*?)\]\]><\/title>/)[1];
                    let cnt = 0;
                    body.match(/<item>.*?<\/item>/g).forEach((item) => {
                        if (cnt >= maxImgs) return;
                        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)[1];
                        const start = title.indexOf(':') + 1;
                        const link = item.match(/<link>(.*?)<\/link>/)[1];
                        const img = item.match(/img src="(.*?)"/);
                        const updateTime = new Date(item.match(/<pubDate>(.*?)<\/pubDate>/)[1]).getTime();
                        if (img) {
                            if (debug || updated[user] === undefined || updated[user] < updateTime) {
                                const encodeImg = encodeURIComponent(img[1]);
                                const imgLink = `shortcuts://run-shortcut?name=PicOpener&input=${encodeImg}`
                                $.notify(`[豆瓣] ${userName}`, `${title.slice(start, len)}...`, `source: ${link}`, {
                                    "media-url": img[1],
                                    "open-url": imgLink
                                });
                                cnt += 1;
                            } else return;
                        } else {
                            $.notify(`[豆瓣] ${userName}`, `${title.slice(start, len)}...`, "点击查看更多", {
                                "open-url": link
                            });
                        }
                    });
                    // update timestamp
                    updated[user] = new Date().getTime();
                    $.write(JSON.stringify(updated), "douban_updated");
                }
            })
            .catch((error) => {
                $.error(error);
            });
    })
)
    .catch((err) => $.error(err))
    .finally(() => $.done());

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${
        date.getMonth() + 1
        }月${date.getDate()}日${date.getHours()}时`;
}

// prettier-ignore
/*********************************** API *************************************/
function API(t = "untitled", s = !1) { return new class { constructor(t, s) { this.name = t, this.debug = s, this.isQX = "undefined" != typeof $task, this.isLoon = "undefined" != typeof $loon, this.isSurge = "undefined" != typeof $httpClient && !this.isLoon, this.isNode = "function" == typeof require, this.isJSBox = this.isNode && "undefined" != typeof $jsbox, this.node = (() => this.isNode ? { request: "undefined" != typeof $request ? void 0 : require("request"), fs: require("fs") } : null)(), this.cache = this.initCache(), this.log(`INITIAL CACHE:\n${JSON.stringify(this.cache)}`), Promise.prototype.delay = function (t) { return this.then(function (s) { return ((t, s) => new Promise(function (e) { setTimeout(e.bind(null, s), t) }))(t, s) }) } } get(t) { return this.isQX ? ("string" == typeof t && (t = { url: t, method: "GET" }), $task.fetch(t)) : new Promise((s, e) => { this.isLoon || this.isSurge ? $httpClient.get(t, (t, i, o) => { t ? e(t) : s({ status: i.status, headers: i.headers, body: o }) }) : this.node.request(t, (t, i, o) => { t ? e(t) : s({ ...i, status: i.statusCode, body: o }) }) }) } post(t) { return this.isQX ? ("string" == typeof t && (t = { url: t }), t.method = "POST", $task.fetch(t)) : new Promise((s, e) => { this.isLoon || this.isSurge ? $httpClient.post(t, (t, i, o) => { t ? e(t) : s({ status: i.status, headers: i.headers, body: o }) }) : this.node.request.post(t, (t, i, o) => { t ? e(t) : s({ ...i, status: i.statusCode, body: o }) }) }) } initCache() { if (this.isQX) return JSON.parse($prefs.valueForKey(this.name) || "{}"); if (this.isLoon || this.isSurge) return JSON.parse($persistentStore.read(this.name) || "{}"); if (this.isNode) { const t = `${this.name}.json`; return this.node.fs.existsSync(t) ? JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)) : (this.node.fs.writeFileSync(t, JSON.stringify({}), { flag: "wx" }, t => console.log(t)), {}) } } persistCache() { const t = JSON.stringify(this.cache); this.log(`FLUSHING DATA:\n${t}`), this.isQX && $prefs.setValueForKey(t, this.name), (this.isLoon || this.isSurge) && $persistentStore.write(t, this.name), this.isNode && this.node.fs.writeFileSync(`${this.name}.json`, t, { flag: "w" }, t => console.log(t)) } write(t, s) { this.log(`SET ${s} = ${JSON.stringify(t)}`), this.cache[s] = t, this.persistCache() } read(t) { return this.log(`READ ${t} ==> ${JSON.stringify(this.cache[t])}`), this.cache[t] } delete(t) { this.log(`DELETE ${t}`), delete this.cache[t], this.persistCache() } notify(t, s, e, i) { const o = "string" == typeof i ? i : void 0, n = e + (null == o ? "" : `\n${o}`); this.isQX && (void 0 !== o ? $notify(t, s, e, { "open-url": o }) : $notify(t, s, e, i)), this.isSurge && $notification.post(t, s, n), this.isLoon && $notification.post(t, s, e), this.isNode && (this.isJSBox ? require("push").schedule({ title: t, body: s ? s + "\n" + e : e }) : console.log(`${t}\n${s}\n${n}\n\n`)) } log(t) { this.debug && console.log(t) } info(t) { console.log(t) } error(t) { console.log("ERROR: " + t) } wait(t) { return new Promise(s => setTimeout(s, t)) } done(t = {}) { this.isQX || this.isLoon || this.isSurge ? $done(t) : this.isNode && !this.isJSBox && "undefined" != typeof $context && ($context.headers = t.headers, $context.statusCode = t.statusCode, $context.body = t.body) } }(t, s) }
/*****************************************************************************/
