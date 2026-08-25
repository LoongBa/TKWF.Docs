export interface ScenarioFrontmatter {
  order: number;
  badge: string;
  tab: string;
  title: string;
  description: string;
  language: string;
}

export interface CodeBlock {
  language: string;
  code: string;
}

export interface ParsedScenario {
  frontmatter: ScenarioFrontmatter;
  codeBlocks: CodeBlock[];
  descriptions: string[];
}

/**
 * 轻量级 frontmatter 解析器（纯前端，不依赖 Node.js Buffer）
 * 替代 gray-matter，避免浏览器环境 Buffer is not defined 错误
 */
function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("---")) {
    return { data: {}, content: trimmed };
  }

  const endIdx = trimmed.indexOf("---", 3);
  if (endIdx === -1) {
    return { data: {}, content: trimmed };
  }

  const yamlBlock = trimmed.substring(3, endIdx).trim();
  const content = trimmed.substring(endIdx + 3).trim();

  // 简易 YAML 解析（仅支持键值对，满足场景文件需求）
  // 注意：文件可能使用 CRLF，先归一化换行再拆分
  const data: Record<string, unknown> = {};
  for (const line of yamlBlock.replace(/\r/g, '').split("\n")) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const key = match[1];
      let value: unknown = match[2].trim();
      // 去除引号
      const strValue = String(value);
      if ((strValue.startsWith('"') && strValue.endsWith('"')) || (strValue.startsWith("'") && strValue.endsWith("'"))) {
        value = strValue.slice(1, -1);
      }
      // 数字转换
      if (typeof value === "string" && /^\d+$/.test(value)) {
        value = Number(value);
      }
      data[key] = value;
    }
  }

  return { data, content };
}

export function parseScenario(rawContent: string): ParsedScenario {
  const { data: frontmatter, content } = parseFrontmatter(rawContent);

  // 提取代码块
  const codeBlocks: CodeBlock[] = [];
  const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  while ((match = codeRegex.exec(content)) !== null) {
    codeBlocks.push({
      language: match[1] || "text",
      code: match[2].trim(),
    });
  }

  // 提取非代码文本段落
  const textWithoutCode = content.replace(/```[\s\S]*?```/g, "").trim();
  const descriptions = textWithoutCode
    .split("\n\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    frontmatter: frontmatter as unknown as ScenarioFrontmatter,
    codeBlocks,
    descriptions,
  };
}
