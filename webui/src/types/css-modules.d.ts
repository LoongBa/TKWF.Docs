declare module "@fontsource-variable/*";
declare module "@fontsource/*";

// JSON 模块声明
declare module "*.json" {
  const value: any;
  export default value;
}

// Markdown raw 导入声明
declare module "*.md?raw" {
  const content: string;
  export default content;
}
