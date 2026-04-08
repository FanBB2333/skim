# Skim Test Flow

这个目录存放一套独立于业务代码的测试流程设计，目标是先把项目的回归路径固化下来，再逐步往各包补充更细的单元测试。

## 分层设计

### 1. 静态检查层

这层用于尽早拦截低成本问题，建议每次提交前执行：

- `go test ./...`
- `go test -race ./...`
- `go vet ./...`
- `go build ./cmd/skim`

说明：

- 当前仓库还没有大量包内单元测试，因此 `go test ./...` 目前主要执行 `tests/` 下的黑盒集成测试。
- `-race` 适合作为 CI 或发布前门禁，不一定要求每次本地迭代都跑。

### 2. CLI 黑盒集成层

这层是当前最重要的主链路验证，全部放在 `tests/cli_workflow_test.go` 中，特点是：

- 使用临时 `HOME`，不污染开发者真实 `~/.skim` 和各 Agent 目录
- 直接构建并调用 `skim` 二进制，覆盖真实 CLI 行为
- 在临时目录中模拟 `Codex / Claude / Gemini` 安装状态

当前覆盖的链路：

- `skim init`
- `skim add`
- `skim install -t <agent>`
- `skim env create`
- `skim skill enable --env`
- `skim activate`
- `skim deactivate`
- `skim agent scan`
- 默认 `symlink` 与可选 `hardlink` 两种 link strategy
- `Gemini` 的 `GEMINI.md` 注入与清理

### 3. 未来建议补充的包内单元测试

这部分建议后续逐步补到对应包旁边，而不是继续堆在 `tests/` 目录：

- `internal/core/store.go`
  - `ParseSkillMD`
  - `Add/List/Get/Remove`
  - malformed skill 跳过逻辑
- `internal/core/env.go`
  - 重复创建环境
  - 重复启用/禁用不存在 skill
- `internal/core/activator.go`
  - store 缺 skill 时的部分失败
  - 激活前自动停用旧环境
- `internal/agent/standard.go`
  - unmanaged skill 冲突保护
  - managed skill 覆盖部署
- `internal/agent/gemini.go`
  - 重复安装同名 skill
  - managed block 清空后的收缩逻辑
- `internal/linker/*.go`
  - marker 行为
  - 目标路径已存在时的分支

## 推荐执行顺序

### 本地快速回归

```bash
./tests/run.sh
```

### 发布前完整回归

```bash
./tests/run.sh --race
```

## 流程门禁建议

### PR 门禁

- `go test ./...`
- `go vet ./...`
- `go build ./cmd/skim`

### 发布门禁

- `./tests/run.sh --race`

## 为什么先采用黑盒测试

当前项目以 CLI 工作流为核心，且大量逻辑依赖磁盘结构、`HOME` 路径和不同 Agent 目录形态。先用黑盒集成测试固定主行为，比一开始就拆大量 mock 更稳，也更接近真实使用方式。
