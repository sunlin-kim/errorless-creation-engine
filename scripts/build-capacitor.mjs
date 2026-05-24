#!/usr/bin/env node
/**
 * Capacitor 용 정적 산출물 빌드 스크립트.
 *
 * 동작:
 *   1) vite build 실행 (BUILD_TARGET=capacitor 로 base: './' 강제)
 *   2) .output/public (또는 dist/client) → capacitor-web/ 로 복사
 *   3) 자가 검증:
 *      - index.html 존재
 *      - index.html / 번들에 절대 http(s):// 또는 supervizion.ai 출처가
 *        포함돼 있지 않은지 검사. (APK 내부에서 해결되지 않으므로 fail.)
 *      - SSR 전용 진입점(.output/server) 이 capacitor-web 으로 새 들어가지
 *        않았는지 검사.
 *
 * 사용:
 *   bun run build:capacitor
 *   bun run cap:sync
 */
import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  readdirSync,
  statSync,
  readFileSync,
  renameSync,
} from "node:fs";
import { join, resolve, relative } from "node:path";

const ROOT = resolve(process.cwd());
const OUT = join(ROOT, "capacitor-web");
const CANDIDATES = [
  join(ROOT, ".output", "public"),
  join(ROOT, "dist", "client"),
  join(ROOT, "dist"),
];

function log(msg) {
  console.log(`[build-capacitor] ${msg}`);
}
function fail(msg) {
  console.error(`[build-capacitor] ERROR: ${msg}`);
  process.exit(1);
}

log("vite build 실행 (BUILD_TARGET=capacitor)...");
execSync("npx vite build", {
  stdio: "inherit",
  cwd: ROOT,
  env: { ...process.env, BUILD_TARGET: "capacitor" },
});

const source = CANDIDATES.find((p) => existsSync(p));
if (!source) {
  fail(
    `클라이언트 산출물을 찾을 수 없습니다. 후보:\n` + CANDIDATES.map((p) => `  - ${p}`).join("\n"),
  );
}
log(`소스 디렉토리: ${source}`);

if (existsSync(OUT)) {
  rmSync(OUT, { recursive: true, force: true });
}
mkdirSync(OUT, { recursive: true });
cpSync(source, OUT, { recursive: true });

// SPA prerender 결과는 기본적으로 _shell.html 로 떨어진다 → index.html 로 승격.
const shellPath = join(OUT, "_shell.html");
const indexPath = join(OUT, "index.html");
if (!existsSync(indexPath) && existsSync(shellPath)) {
  renameSync(shellPath, indexPath);
  log("_shell.html → index.html 로 승격");
}
if (!existsSync(indexPath)) {
  fail(
    "index.html 이 없습니다. TanStack Start 의 SPA prerender(tanstackStart.spa.enabled) 를 활성화하거나, " +
      "SPA 빌드 산출물을 명시적으로 생성해 주세요.",
  );
}

/* --------------- 자가 검증: 절대 출처 금지 --------------- */
function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

const TEXT_EXT = /\.(html|js|mjs|cjs|css|map|json|txt|webmanifest)$/i;
// 자원 로딩(src=/href=/import) 만 금지. 사용자 액션으로 외부 브라우저에서 여는
// 링크 문자열(예: "https://vizionpower.supervizion.ai", 익스플로러 URL, RPC URL)은 허용.
const FORBIDDEN = [
  // <script src="https://..."> / <link href="https://...">
  /(?:src|href)\s*=\s*["']https?:\/\//i,
  // import "https://..."
  /import\s+[^"'`]*["']https?:\/\//i,
];

const violations = [];
for (const f of walk(OUT)) {
  if (!TEXT_EXT.test(f)) continue;
  const rel = relative(OUT, f);
  const body = readFileSync(f, "utf8");
  for (const re of FORBIDDEN) {
    const m = body.match(re);
    if (m) violations.push(`${rel}: "${m[0].slice(0, 120)}"`);
  }
}

if (violations.length > 0) {
  fail(
    "절대 출처(http(s)://) 또는 supervizion.ai 참조가 발견되었습니다 " +
      "(APK 내부에서 로드되지 않습니다):\n  - " +
      violations.slice(0, 20).join("\n  - "),
  );
}

/* --------------- 자가 검증: SSR 핸들러가 섞이지 않았는지 --------------- */
const SSR_HINTS = ["_worker.js", "server-entry", "nitro.json"];
for (const f of walk(OUT)) {
  const rel = relative(OUT, f);
  if (SSR_HINTS.some((h) => rel.includes(h))) {
    fail(`SSR 전용 산출물이 capacitor-web 에 포함되어 있습니다: ${rel}`);
  }
}

log(`완료. 산출물: ${OUT}`);
log(`  - index.html: OK`);
log(`  - 절대 출처: 없음`);
log(`  - SSR 진입점: 없음`);
log("다음 단계: bun run cap:sync");
