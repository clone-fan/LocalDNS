# 安装与更新

当前发行版本：**后端 FJG20 / UI 2026.10.15.2**。

## 选择下载包

从 [UI 2026.10.15.2 Release](https://github.com/yyhoworks/LocalDNS/releases/tag/ui-v2026.10.15.2) 下载：

| 文件 | 用途 |
|---|---|
| `LocalDNS_FJG20_UI_2026.10.15.2_Full.zip` | 新安装：后端预编译程序、原始 FJG20 预设配置、规则和新 UI |
| `LocalDNS_UI_2026.10.15.2_Update.zip` | 已安装环境更新界面 |
| `SHA256SUMS.txt` | 两个发行包的 SHA-256 校验值 |

在同一目录核对：

```sh
sha256sum -c SHA256SUMS.txt
```

## 已安装环境更新 UI

将 UI 升级包解压到临时目录，进入解压目录运行：

```sh
sh install-ui.sh /opt/localdns
```

用能写入安装目录的用户执行。安装位置不同时修改最后一个参数。

脚本先验证包内校验清单、备份原 UI，再替换界面。现有 DNS 配置、规则与后端程序保持原样，通常无需重启服务。

访问 `http://服务器地址:9099/ui/`；端口以实际配置为准。更新后刷新浏览器，必要时使用强制刷新。

## 新安装

完整包中的 `localdns/` 放到 `/opt/localdns`。默认程序为 **amd64-v3**；其他二进制位于 `LocalDNS_FJG20_Binaries/localdns-FJG20/`，按设备架构选择。

| 文件 | 平台 |
|---|---|
| `localdns-amd64-v1` | x86-64 v1 |
| `localdns-amd64-v3` | x86-64 v3 |
| `localdns-arm64` | ARM64 |
| `localdns-armv7` | ARMv7 |

将所选程序放置为 `/opt/localdns/bin/localdns`，然后运行：

```sh
chmod +x /opt/localdns/bin/localdns
/opt/localdns/bin/localdns --root /opt/localdns --config /opt/localdns/config/localdns.json
```

监听地址和端口由 `localdns/config/localdns.json` 决定。完整包的配置来自原始 FJG20 发行包，需按实际环境调整。

`localdns.service` 是 systemd 服务示例。Alpine/OpenRC 使用对应的服务启动方式，运行库要求沿用 FJG20 程序本身的要求。

## 回退 UI

更新脚本会输出压缩备份和 `ui.previous-...` 目录的位置。

1. 将当前 `ui` 目录改名保存。
2. 将对应 `ui.previous-...` 目录改回 `ui`。
3. 刷新浏览器。

保留需要的浏览器外观参数。界面版号记录在包内 `ui/version.json`。

