# 汇率通

跨端汇率转换器：桌面可运行 `.exe`，网页可公网访问。

**在线使用：** https://zzj6925267.github.io/huilv/

## 功能

- PC / 手机自适应界面
- 汇率每日从公开接口同步（失败时使用本地缓存）
- 支持人民币、美元、欧元、日元等常见币种
- Windows 便携版 `.exe`，无需安装

## 使用方式

### 网页（推荐分享给他人）

打开：https://zzj6925267.github.io/huilv/

### 桌面

1. 打开 `dist/汇率通-1.0.0-portable.exe`
2. 应用会自动显示换算界面
3. 同一 Wi‑Fi 下，手机浏览器也可打开界面底部提示的地址

### 开发运行

```bash
npm install
npm start
```

仅预览网页：

```bash
npm run web
```

### 重新打包 exe

```bash
npm run dist
```

生成文件位于 `dist/` 目录。

## 数据来源

汇率接口：`https://open.er-api.com`（基于公开市场汇率，约每日更新）。
