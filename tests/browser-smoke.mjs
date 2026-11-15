import { spawn } from "node:child_process";
import {
  writeFileSync,
  readFileSync,
  mkdirSync,
  existsSync,
  rmSync,
  mkdtempSync,
} from "node:fs";

const HTTP_PORT = 8959;
const CDP_PORT = 9360;
const SHOTS = process.env.SMOKE_SHOTS === "1";
const root = new URL("..", import.meta.url).pathname;

const profile = mkdtempSync("/tmp/daymark-chrome-");
const server = spawn(
  "python3",
  [
    "-m",
    "http.server",
    String(HTTP_PORT),
    "--bind",
    "127.0.0.1",
    "--directory",
    `${root}docs`,
  ],
  { stdio: "ignore", detached: true },
);
const chrome = spawn(
  "google-chrome",
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore", detached: true },
);

const cleanup = async (code) => {
  for (const child of [chrome, server]) {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {}
  }
  await Promise.all(
    [chrome, server].map((child) =>
      child.exitCode !== null
        ? Promise.resolve()
        : new Promise((r) => child.once("exit", r)),
    ),
  );
  rmSync(profile, { recursive: true, force: true });
  process.exit(code);
};
const timeout = setTimeout(() => {
  console.error("smoke: timeout");
  cleanup(1);
}, 90000);
process.on("SIGINT", () => cleanup(2));
process.on("uncaughtException", (e) => {
  console.error(e);
  cleanup(1);
});
process.on("unhandledRejection", (e) => {
  console.error(e);
  cleanup(1);
});

async function waitFor(fn, label, timeoutMs = 60000) {
  const start = Date.now();
  for (;;) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {}
    if (Date.now() - start > timeoutMs)
      throw new Error(`timed out waiting for ${label}`);
    await new Promise((r) => setTimeout(r, 250));
  }
}

const checks = [];
const check = (name, ok, detail = "") => {
  checks.push({ name, ok, detail });
  console.log(
    `${ok ? "ok" : "NOT OK"} - ${name}${detail ? " - " + detail : ""}`,
  );
};

await waitFor(
  async () => (await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).ok,
  "chrome devtools",
);
const target = await (
  await fetch(`http://127.0.0.1:${CDP_PORT}/json/new`, { method: "PUT" })
).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let mid = 0;
const rpcPending = new Map();
const consoleErrors = [];
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && rpcPending.has(msg.id)) {
    rpcPending.get(msg.id)(msg);
    rpcPending.delete(msg.id);
  } else if (msg.method === "Runtime.exceptionThrown")
    consoleErrors.push(
      msg.params.exceptionDetails?.exception?.description ?? "page exception",
    );
};
const cdp = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++mid;
    rpcPending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const res = await cdp("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.result?.exceptionDetails)
    throw new Error(JSON.stringify(res.result.exceptionDetails));
  return res.result?.result?.value;
};
const shot = async (name) => {
  if (!SHOTS) return;
  await new Promise((r) => setTimeout(r, 900));
  const metrics = await cdp("Page.getLayoutMetrics");
  const size = metrics.result.cssContentSize;
  const r = await cdp("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: size.width, height: size.height, scale: 1 },
  });
  writeFileSync(
    `${root}smoke-${name}.png`,
    Buffer.from(r.result.data, "base64"),
  );
};


await cdp('Runtime.enable');await cdp('Page.enable');
await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:960,deviceScaleFactor:1,mobile:false});
await cdp('Page.navigate',{url:`http://127.0.0.1:${HTTP_PORT}/`});
await waitFor(()=>evaluate(`!document.getElementById('asset').disabled`),'derived data loaded');
check('default SPY',await evaluate(`document.getElementById('summary').textContent.startsWith('SPY:')`));
check('ten sessions',await evaluate(`document.querySelectorAll('#day option').length===10`));
check('130 heatmap cells',await evaluate(`document.querySelectorAll('#heatmap button').length===130`));
check('13 exact profile rows',await evaluate(`document.querySelectorAll('#numbers tbody tr').length===13`));
const initial=await evaluate(`document.getElementById('open').textContent`);
check('SPY variance fixture',await evaluate(`document.getElementById('open').textContent==='2.54×'`));
check('first cell real numeric share',await evaluate(`document.getElementById('selected-value').textContent==='0.34×'&&document.getElementById('selected-share').textContent.startsWith('2.58%')`));
check('heatmap colors applied',await evaluate(`getComputedStyle(document.querySelector('#heatmap button')).backgroundColor!=='rgba(0, 0, 0, 0)'`));
await shot('default');
await evaluate(`document.getElementById('metric').value='volume';document.getElementById('metric').dispatchEvent(new Event('change'))`);
check('volume changes profile and labels',await evaluate(`document.getElementById('profile-title').textContent.includes('volume')&&document.getElementById('selected-share').textContent.startsWith('8.69%')`));
check('volume caption is shares not ticks',await evaluate(`document.getElementById('measure-unit').textContent.startsWith('Shares traded')`));
await shot('volume');
await evaluate(`document.getElementById('asset').value='AAPL';document.getElementById('asset').dispatchEvent(new Event('change'))`);
check('asset recomputes all views',await evaluate(`document.getElementById('summary').textContent.startsWith('AAPL:')&&document.querySelector('#heatmap caption').textContent.startsWith('AAPL')`));
await evaluate(`document.querySelectorAll('#heatmap button')[129].click()`);
check('cell selects day and bin',await evaluate(`document.getElementById('day').value==='2026-11-13'&&document.getElementById('bin').value==='12'&&document.getElementById('selected-name').textContent.includes('15:30 to 16:00')`));
check('single marked selection',await evaluate(`document.querySelectorAll('#heatmap button[aria-pressed="true"]').length===1`));
const before=await evaluate(`document.getElementById('close').textContent`);
await evaluate(`document.getElementById('day').value='2026-11-02';document.getElementById('day').dispatchEvent(new Event('change'))`);
check('selecting a day leaves mean invariant',(await evaluate(`document.getElementById('close').textContent`))===before);
await evaluate(`document.getElementById('bin').focus()`);
await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
check('keyboard half-hour inspector',await evaluate(`document.getElementById('bin-value').textContent==='15:00'`));
await evaluate(`document.querySelector('details').open=true`);
check('numeric table selected day is exact',await evaluate(`Math.abs(+document.querySelectorAll('#numbers tbody tr')[11].lastElementChild.textContent-parseFloat(document.getElementById('selected-value').textContent))<.006`));
for(const width of[390,320]){
 await cdp('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});
 check(`mobile ${width} no page overflow`,await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
 check(`mobile ${width} map independently scrolls`,await evaluate(`document.querySelector('.map-wrap').scrollWidth>document.querySelector('.map-wrap').clientWidth`));
 await evaluate(`scrollTo(0,0)`);await shot(`mobile-${width}`);
}
check('no page exceptions',consoleErrors.length===0,consoleErrors[0]??'');
check('no visible error',await evaluate(`document.getElementById('error').hidden`));
await cdp('Network.enable');await cdp('Network.setBlockedURLs',{urls:['*/data/shares.csv']});await cdp('Page.reload',{ignoreCache:true});
await waitFor(()=>evaluate(`!document.getElementById('error').hidden`),'archive error state');
check('archive failure visible, controls disabled, no partial cells',await evaluate(`document.getElementById('asset').disabled&&document.getElementById('bin').disabled&&document.querySelectorAll('#heatmap button').length===0&&document.getElementById('error').textContent.includes('could not be loaded')`));
const failed=checks.filter(c=>!c.ok);console.log(`${checks.length-failed.length} passed, ${failed.length} failed`);clearTimeout(timeout);await cleanup(failed.length?1:0);
