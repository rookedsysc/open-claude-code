import assert from "node:assert/strict"
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, it } from "node:test"

const testDirectories: string[] = []

function createTempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "opencode-installer-"))
  testDirectories.push(directory)
  return directory
}

function createPackageFixture() {
  const packageRoot = createTempDir()
  const scriptPath = join(packageRoot, "scripts", "install-opencode-plugin.sh")
  const distEntry = join(packageRoot, "dist", "index.js")

  mkdirSync(dirname(scriptPath), { recursive: true })
  mkdirSync(dirname(distEntry), { recursive: true })

  copyFileSync(join(process.cwd(), "scripts", "install-opencode-plugin.sh"), scriptPath)
  writeFileSync(distEntry, 'export default function ClaudeCompatPlugin() {}\n')

  return { packageRoot, scriptPath, distEntry }
}

describe("install-opencode-plugin.sh", () => {
  afterEach(() => {
    for (const directory of testDirectories.splice(0, testDirectories.length)) {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("전역 설치 시 OpenCode 플러그인 로더를 생성한다", () => {
    // 주어진 환경
    const { packageRoot, scriptPath, distEntry } = createPackageFixture()
    const configRoot = createTempDir()

    // 실행
    const result = spawnSync("bash", [scriptPath, "--global", "--skip-build"], {
      cwd: packageRoot,
      encoding: "utf-8",
      env: {
        ...process.env,
        XDG_CONFIG_HOME: configRoot,
      },
    })

    // 검증
    assert.equal(result.status, 0, result.stderr)

    const loaderPath = join(configRoot, "opencode", "plugins", "open-claude-code.js")
    const loaderSource = readFileSync(loaderPath, "utf-8")

    assert.ok(loaderSource.includes(`import ClaudeCompatPlugin from "${distEntry}"`))
    assert.ok(loaderSource.includes("export default ClaudeCompatPlugin"))
  })

  it("프로젝트 설치 시 대상 프로젝트 아래에 로더를 생성한다", () => {
    // 주어진 환경
    const { packageRoot, scriptPath, distEntry } = createPackageFixture()
    const targetProject = createTempDir()

    // 실행
    const result = spawnSync("bash", [scriptPath, "--project", targetProject, "--skip-build"], {
      cwd: packageRoot,
      encoding: "utf-8",
      env: process.env,
    })

    // 검증
    assert.equal(result.status, 0, result.stderr)

    const loaderPath = join(targetProject, ".opencode", "plugins", "open-claude-code.js")
    const loaderSource = readFileSync(loaderPath, "utf-8")

    assert.ok(loaderSource.includes(`import ClaudeCompatPlugin from "${distEntry}"`))
    assert.ok(result.stdout.includes("Installed loader:"))
  })
})
