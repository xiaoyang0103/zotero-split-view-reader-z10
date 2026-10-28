# Split-View Reader：Zotero 10 社区兼容版

基于 [Fuling Lin 的 Split-View Reader](https://github.com/zerolfl/zotero-split-view-reader) 修改。**这是独立维护的社区修改版。**原作者、版权与许可声明见 [NOTICE.md](NOTICE.md) 和 [LICENSE](LICENSE)。

## 功能与修改

- 在一个标签页内并排阅读同一篇或两篇不同 PDF。
- 默认左右独立滚动；鼠标在哪侧正文上，滚轮就操作哪侧。
- 正文右键“设为主视图”可开启联动，“取消主视图”恢复独立滚动。
- 合并同步事件、清理监听器和待执行动画帧，避免重复任务。
- 鼠标移入区域时选择当前侧；连续滚轮不触发插件区域激活任务。

详细修改记录与构建说明见 [ZOTERO10_COMPATIBILITY.md](ZOTERO10_COMPATIBILITY.md)。原版 README 保存在 [UPSTREAM_README.md](UPSTREAM_README.md)。

## 安装

1. 在本仓库 Releases 中下载 `.xpi`。
2. Zotero → 工具 → 插件 → 齿轮 → 从文件安装插件。
3. 选择 XPI，按提示完成安装并重启。

本版本使用手动更新。插件 ID 沿用上游，安装后会更新已有 Split-View Reader；两个相同 ID 的版本不能并行安装。

## Windows 连续滚动停顿

本机曾捕获到 Windows 输入服务与旧 UIA 桥接接口之间的 COM 等待。对同类现象，可以在 Zotero“设置 → 高级 → 配置编辑器”中检查 `accessibility.uia.enable`；在验证环境中设为数值 **2**，重启后改善了连续滚动。

2 表示在兼容时使用原生 UI Automation，保留辅助技术兼容检查。该设置不由插件自动写入。使用屏幕朗读或其他辅助技术的环境需要单独确认兼容性。

验证环境仅为 Windows、Zotero 10.0.6 / Gecko 140.17.0。两篇测试 PDF 各进行了 90 次原生滚轮往返输入，另一侧保持不动；最大事件循环间隔约 123 ms / 57 ms。另有 11 项 Node 回归检查及 11 项 Zotero 内检查通过。**这些是本机诊断结果，不是通用加速比例或界面帧率保证。** macOS、Linux 和其他版本尚未实测。

## 从源码构建

安装 Node.js、npm 和 Git 后，在项目根目录运行：

```powershell
npm ci --ignore-scripts --no-audit --no-fund
node test/scroll-behavior.node.mjs
npm run build
```

锁文件包含 GitHub SSH 形式的开发依赖。如果没有配置 GitHub SSH，可在安装依赖时临时改用 HTTPS：

```powershell
$env:GIT_CONFIG_COUNT = '2'
$env:GIT_CONFIG_KEY_0 = 'url.https://github.com/.insteadOf'
$env:GIT_CONFIG_VALUE_0 = 'ssh://git@github.com/'
$env:GIT_CONFIG_KEY_1 = 'url.https://github.com/.insteadOf'
$env:GIT_CONFIG_VALUE_1 = 'git@github.com:'
npm ci --ignore-scripts --no-audit --no-fund
```

产物为 `.scaffold/build/split-view-reader.xpi`。实际 PDF 运行检查使用独立配置和外部测试文献，准备方法见修改记录；发行源码不包含文献文件或个人 Zotero 配置。

首次发布采用网页手动 Release，上游 Actions 模板位于 `.github/upstream-workflows/`，需要时审阅配置后再启用。

## 来源与许可

- 原作者：Fuling Lin。
- 上游：<https://github.com/zerolfl/zotero-split-view-reader>。
- 基础版本/提交：v1.3.0 / `600f1bd99d9a52a99683702f6681bf34b83bfec3`。
- 修改与发布维护账号：xiaoyang0103；修改日期：2026-10-27、2026-10-28。
- 许可：**AGPL-3.0-or-later**，保留原许可证、版权声明和免责声明。发行 XPI 时同时提供对应源码。
