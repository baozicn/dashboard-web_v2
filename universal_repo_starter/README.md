# PROJECT_NAME

简述：一句话说明你要解决的问题和主要功能。

## 快速开始
```bash
# 任选其一，根据你的技术栈替换
# C/C++ (CMake)
cmake -S . -B build && cmake --build build
# Python
python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && python main.py
# Node.js
npm i && npm run start
```

## 目录结构（建议）
```
.
├─ src/           # 源码
├─ include/       # 头文件（C/C++）或 typings（TS）
├─ docs/          # 文档/图片/PDF
├─ test/          # 单元测试
├─ scripts/       # 开发/发布脚本
├─ .github/workflows/ci.yml  # CI 配置
├─ .gitignore
├─ LICENSE
└─ CONTRIBUTING.md
```

## 贡献指南（速览）
1. 从 `main` 新建特性分支：`git checkout -b feat/short-desc`
2. 提交信息遵循：`<type>(scope): <subject>`（如 `feat(core): add FFT`）
3. 提交 PR，关联 Issue，CI 通过后合并。

## 许可证
本项目采用 MIT 许可证，详见 [LICENSE](LICENSE)。
