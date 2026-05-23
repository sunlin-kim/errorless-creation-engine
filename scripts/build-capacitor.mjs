#!/usr/bin/env node
/**
 * Capacitor 용 정적 산출물 빌드 스크립트.
 *
 * TanStack Start 는 기본적으로 SSR 산출물(.output/) 을 만들지만, Capacitor
 * 안드로이드 래퍼는 정적 파일만 로드한다 (server.url 미설정). 따라서
 * 클라이언트 번들 + index.html 만 추려 `capacitor-web/` 에 복사한다.
 *
 * 동작:
 *   1) vite build 실행
 *   2) .output/public (Nitro client assets) → capacitor-web/ 로 복사
 *   3) index.html 이 없으면 .output/public/index.html 또는
 *      .output/server/index.html 후보를 탐색
 *
 * 사용:
 *   node scripts/build-capacitor.mjs
 *   npx cap sync android
 *   npx cap open android
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

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

log("vite build 실행...");
execSync("npx vite build", { stdio: "inherit", cwd: ROOT });

const source = CANDIDATES.find((p) => existsSync(p));
if (!source) {
  console.error(
    `[build-capacitor] 클라이언트 산출물을 찾을 수 없습니다. 후보:\n` +
      CANDIDATES.map((p) => `  - ${p}`).join("\n"),
  );
  process.exit(1);
}
log(`소스 디렉토리: ${source}`);

if (existsSync(OUT)) {
  rmSync(OUT, { recursive: true, force: true });
}
mkdirSync(OUT, { recursive: true });
cpSync(source, OUT, { recursive: true });

if (!existsSync(join(OUT, "index.html"))) {
  console.error(
    "[build-capacitor] index.html 이 없습니다. TanStack Start 의 프리렌더 설정을 " +
      "활성화하거나, SPA 빌드 산출물을 명시적으로 생성해 주세요.",
  );
  process.exit(1);
}

log(`완료. 산출물: ${OUT}`);
log("다음 단계: npx cap sync android && npx cap open android");
