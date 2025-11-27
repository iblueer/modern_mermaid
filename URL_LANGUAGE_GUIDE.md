# URL 语言参数使用指南

## 功能说明

现在网站支持通过 URL 查询参数 `lang` 自动切换语言。这个功能对于分享链接、国际化推广和 SEO 优化非常有用。

## 使用方法

### 1. 通过 URL 参数切换语言

在 URL 末尾添加 `?lang=语言代码` 即可自动切换到对应语言：

```
https://yourdomain.com/?lang=zh-CN   # 切换到简体中文
https://yourdomain.com/?lang=zh-TW   # 切换到繁体中文
https://yourdomain.com/?lang=en      # 切换到英语
https://yourdomain.com/?lang=ja      # 切换到日语
https://yourdomain.com/?lang=es      # 切换到西班牙语
https://yourdomain.com/?lang=pt      # 切换到葡萄牙语
```

### 2. 支持的语言代码

| 语言代码 | 语言名称 |
|---------|---------|
| `en` | English (英语) |
| `zh-CN` | 简体中文 |
| `zh-TW` | 繁體中文 |
| `ja` | 日本語 (日语) |
| `es` | Español (西班牙语) |
| `pt` | Português (葡萄牙语) |

### 3. 语言切换优先级

系统按以下优先级确定显示语言：

1. **URL 参数** (最高优先级)
   - 如果 URL 中包含有效的 `lang` 参数，则优先使用该语言

2. **本地存储** (次优先级)
   - 如果用户之前通过语言切换器选择过语言，会使用保存的设置

3. **默认语言** (最低优先级)
   - 如果以上都没有，则默认使用英语 (`en`)

### 4. 自动同步

- 当用户通过界面的语言切换器改变语言时，URL 参数会自动更新
- 当用户点击浏览器的前进/后退按钮时，语言会自动切换到对应的历史状态
- HTML `<html lang="">` 属性会自动更新，有利于 SEO 和可访问性

## 实现细节

### 文件修改

1. **src/contexts/LanguageContext.tsx**
   - 添加了 `getLanguageFromURL()` 函数来解析 URL 参数
   - 添加了 `updateURLLanguage()` 函数来更新 URL 参数
   - 在初始化时检查 URL 参数
   - 监听浏览器历史状态变化
   - 自动更新 HTML lang 属性

2. **src/hooks/useHtmlLang.ts** (新增)
   - 提供了一个可复用的 hook 来动态更新 HTML lang 属性

### 技术特点

- **无刷新切换**: 语言切换不会导致页面刷新
- **URL 同步**: URL 参数始终反映当前语言状态
- **历史记录支持**: 支持浏览器前进/后退按钮
- **SEO 友好**: 自动更新 HTML lang 属性
- **类型安全**: 使用 TypeScript 确保语言代码的正确性

## 应用场景

### 1. 社交媒体分享

分享不同语言版本的链接给不同地区的用户：

```
Facebook (英语用户): https://yourdomain.com/?lang=en
微信 (中文用户): https://yourdomain.com/?lang=zh-CN
Twitter (日语用户): https://yourdomain.com/?lang=ja
```

### 2. 邮件营销

在邮件中嵌入用户首选语言的链接：

```html
<a href="https://yourdomain.com/?lang=zh-CN">访问中文版</a>
<a href="https://yourdomain.com/?lang=en">Visit English Version</a>
```

### 3. SEO 优化

配合 sitemap.xml 中的 hreflang 标签，提供多语言版本：

```xml
<url>
  <loc>https://yourdomain.com/</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://yourdomain.com/?lang=en"/>
  <xhtml:link rel="alternate" hreflang="zh-CN" href="https://yourdomain.com/?lang=zh-CN"/>
  <!-- 其他语言版本 -->
</url>
```

### 4. 广告投放

在不同地区的广告中使用对应语言的着陆页链接，提高转化率。

## 测试建议

1. 在浏览器中打开 `http://localhost:5173/?lang=zh-CN`
2. 验证页面显示为中文
3. 通过界面切换到其他语言
4. 检查 URL 是否自动更新
5. 点击浏览器的后退按钮
6. 验证语言是否切换回之前的状态

## 注意事项

- 如果提供的语言代码无效，系统会忽略该参数并使用默认规则
- URL 参数始终优先于本地存储的设置
- 语言切换会自动保存到 localStorage，即使关闭浏览器后再次访问也会记住用户的选择

