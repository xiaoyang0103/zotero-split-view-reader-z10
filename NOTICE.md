# 来源与修改声明

本项目基于 Fuling Lin 的 Split-View Reader 修改，以独立仓库形式发布。

- 上游：https://github.com/zerolfl/zotero-split-view-reader
- 基础版本：v1.3.0
- 基础提交：600f1bd99d9a52a99683702f6681bf34b83bfec3
- 原作者：Fuling Lin
- 发布维护账号：xiaoyang0103
- 修改日期：2026-10-27、2026-10-28
- 许可：沿用原项目 AGPL-3.0-or-later；保留 LICENSE、原作者声明和免责声明。

功能修改包括 Zotero 10 兼容声明、默认独立滚动、同步事件和动画帧清理、鼠标区域激活优化。详见 ZOTERO10_COMPATIBILITY.md。

2026-10-28 独立发布整理：设置维护仓库链接、移除上游自动更新入口，采用手动更新；上游工作流模板保存在 .github/upstream-workflows/，首次上传不自动运行它们。插件 ID 与上游相同，安装本包会更新现有 Split-View Reader，不能与同 ID 原版并行安装。

公开 XPI 基于已验证的生产包进行元数据重打包，仅调整 homepage_url、移除 update_url 并更新修改声明；编译 JavaScript 及其余功能资源保持原字节。对应完整功能源码随本仓库提供，npm run build 可重新构建。

Windows UIA 兼容设置是独立的应用设置，不由插件静默修改。此前的本机诊断结果不构成对所有设备、辅助技术或 PDF 的保证。本项目不是上游官方发布，也不暗示原作者对这些修改提供认可或支持。
