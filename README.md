# Cyber Bones

> "工欲善其事，必先利其器"

Cyber Bones web application infrastructure for a better experience to every application developer.

## 📝 Index

- [Quick Start](#getting_started)
- [Repo Structure](#repo_structure)
- [Design Philosophy](#design_philosophy)
- [Development Guide](development_guide)
- [Road Map](#road_map)
- [Q&A](#faq)
- [Acknowledgement](#acknowledgement)

## 🏁 Quick Start <a name = "getting_started"></a>
### Preparation

Install [NodeJs](https://nodejs.org/en/) （ see `nodeSupportedVersionRange` in  [rush.json](./rush.json) for supported version scope），recommend options：
- [nvm](https://github.com/nvm-sh/nvm) :  Node version management.
- [nrm](https://github.com/Pana/nrm) : npm registry management.
```
npm i nrm -g
npm i @microsoft/rush -g
npm i pnpm -g
```
### initialization
Run the following command to install all dependencies.
```
rush install
```


## 🗂 Repository Structure  <a name = "repo_structure"></a>
| Name       | Type |  Description    |
| --------------|--- | ----------- |
| /common| Common | Common documents for cross-infrastructure projects |
| /create-web-app | Category | Application scaffolds  |
| /app-dev-kit | Category | development kits |
| /design-system| Category| design system |


## 🎨 Design Philosophy <a name = "design_philosophy"></a>

## 📖 Development Guide <a name ="developer_guide"></a>
See [Development Guide](./common/docs/developerGuide.md).

## 🗺 Road Map <a name = "road_map"></a>
- Monitor SDK
- Node RPC SDK

## 🚨 Q&A <a name = "faq"></a>
See [Q&A](./common/docs/FAQ.md).

## 🎉 Acknowledgement <a name = "acknowledgement"></a>
- [rush.js](https://rushjs.io/) - A scalable monorepo manager for the web
- [pnpm](https://pnpm.io/) - Fast, disk space efficient package manager
